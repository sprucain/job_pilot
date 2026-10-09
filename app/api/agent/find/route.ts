import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { discoverJobs } from "@/agent/adzuna";
import { scoreJob } from "@/agent/matcher";
import type { ScoredJob } from "@/agent/types";
import { MATCH_THRESHOLD } from "@/lib/constants";
import { createInsforgeServer } from "@/lib/insforge-server";
import { flushPostHogSafely, getPostHogClient } from "@/lib/posthog-server";
import { getCurrentUserProfile } from "@/lib/profile-server";

const findJobsSchema = z.object({
  jobTitle: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200),
});

const FIND_JOBS_FAILED_ERROR = "Job search failed. Please try again.";

function buildResultMessage(totalFound: number, savedCount: number): string {
  if (totalFound === 0) return "No jobs found for that search. Try a different title or location.";
  return `Found ${totalFound} job${totalFound === 1 ? "" : "s"} and saved ${savedCount} strong match${savedCount === 1 ? "" : "es"}.`;
}

export async function POST(req: NextRequest) {
  try {
    const insforge = await createInsforgeServer();
    const { user, profile } = await getCurrentUserProfile(insforge);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid search input" }, { status: 400 });
    }
    const parseResult = findJobsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid search input" }, { status: 400 });
    }
    const { jobTitle, location } = parseResult.data;

    const startedAt = new Date().toISOString();
    const { data: runRow, error: runInsertError } = await insforge.database
      .from("agent_runs")
      .insert([
        {
          user_id: user.id,
          status: "running",
          job_title_searched: jobTitle,
          location_searched: location,
          started_at: startedAt,
        },
      ])
      .select("id")
      .single<{ id: string }>();
    if (runInsertError || !runRow) {
      console.error("[agent/find]", runInsertError);
      return NextResponse.json({ success: false, error: FIND_JOBS_FAILED_ERROR }, { status: 500 });
    }
    const runId = runRow.id;

    // Fired only once the run row itself is confirmed to exist — an event with no
    // corresponding agent_run to correlate it to would be worse than firing slightly
    // later.
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.id,
      event: "job_search_started",
      properties: { userId: user.id, jobTitle, location },
    });
    await flushPostHogSafely(posthog);

    const discoveryResult = await discoverJobs(insforge, runId, user.id, jobTitle, location);
    if (!discoveryResult.success) {
      await insforge.database
        .from("agent_runs")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", runId);
      return NextResponse.json({ success: false, error: FIND_JOBS_FAILED_ERROR }, { status: 500 });
    }
    const { jobs } = discoveryResult;

    // Best-effort pre-filter only, to avoid spending Venice calls scoring jobs we
    // already know are saved — correctness of the actual dedup no longer depends on
    // this query succeeding. The real guarantee is the unique index on
    // jobs(user_id, source_url) + the ignoreDuplicates upsert below, which is atomic
    // and race-safe even across two concurrent runs; this SELECT can fail (or simply
    // be stale by the time the upsert runs) without ever causing a duplicate row.
    const { data: existingRows, error: existingError } = await insforge.database
      .from("jobs")
      .select("source_url")
      .eq("user_id", user.id);
    if (existingError) console.error("[agent/find]", existingError);
    const existingSourceUrls = new Set((existingRows ?? []).map((row: { source_url: string }) => row.source_url));
    const jobsToScore = jobs.filter((job) => !existingSourceUrls.has(job.sourceUrl));

    const scoreResults = await Promise.all(
      jobsToScore.map((job) => scoreJob(insforge, runId, user.id, job, profile)),
    );

    const candidates: ScoredJob[] = [];
    const seenSourceUrls = new Set<string>();
    jobsToScore.forEach((job, index) => {
      const scoreResult = scoreResults[index];
      if (!scoreResult.success) return;
      if (scoreResult.score.matchScore < MATCH_THRESHOLD) return;
      if (seenSourceUrls.has(job.sourceUrl)) return;
      seenSourceUrls.add(job.sourceUrl);
      candidates.push({ ...job, ...scoreResult.score });
    });

    let savedCount = 0;

    if (candidates.length > 0) {
      const rows = candidates.map((candidate) => ({
        run_id: runId,
        user_id: user.id,
        source: "search" as const,
        source_url: candidate.sourceUrl,
        external_apply_url: candidate.externalApplyUrl,
        title: candidate.title,
        company: candidate.company,
        location: candidate.location,
        salary: candidate.salary,
        job_type: candidate.jobType,
        about_role: candidate.aboutRole,
        match_score: candidate.matchScore,
        match_reason: candidate.matchReason,
        matched_skills: candidate.matchedSkills,
        missing_skills: candidate.missingSkills,
        found_at: new Date().toISOString(),
      }));

      // upsert + ignoreDuplicates against the jobs(user_id, source_url) unique index —
      // not a plain insert — so a listing already saved by an earlier or concurrent
      // run is silently skipped at the database level instead of racing on an
      // in-memory check. Only rows PostgREST actually inserted come back from
      // .select(), so savedCount/job_found only ever reflect real new saves.
      const { data: insertedRows, error: insertError } = await insforge.database
        .from("jobs")
        .upsert(rows, { onConflict: "user_id,source_url", ignoreDuplicates: true })
        .select("source_url, match_score")
        .returns<{ source_url: string; match_score: number }[]>();
      if (insertError) {
        console.error("[agent/find]", insertError);
        await insforge.database
          .from("agent_runs")
          .update({ status: "failed", completed_at: new Date().toISOString() })
          .eq("id", runId);
        return NextResponse.json({ success: false, error: FIND_JOBS_FAILED_ERROR }, { status: 500 });
      }

      savedCount = insertedRows?.length ?? 0;
      (insertedRows ?? []).forEach((row) => {
        posthog.capture({
          distinctId: user.id,
          event: "job_found",
          properties: { userId: user.id, source: "search", matchScore: row.match_score },
        });
      });
      await flushPostHogSafely(posthog);
    }

    await insforge.database
      .from("agent_runs")
      .update({
        status: "completed",
        jobs_found: savedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    revalidatePath("/find-jobs");

    return NextResponse.json({
      success: true,
      data: {
        totalFound: jobs.length,
        savedCount,
        message: buildResultMessage(jobs.length, savedCount),
      },
    });
  } catch (error) {
    console.error("[agent/find]", error);
    return NextResponse.json({ success: false, error: FIND_JOBS_FAILED_ERROR }, { status: 500 });
  }
}
