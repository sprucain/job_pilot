import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { researchCompanySite, type CompanyResearchData } from "@/agent/researcher";
import { synthesizeDossier } from "@/agent/research-synthesis";
import { logAgentError } from "@/lib/agent-logs";
import { resolveCompanyHomepage } from "@/lib/company-url";
import { createInsforgeServer } from "@/lib/insforge-server";
import { flushPostHogSafely, getPostHogClient } from "@/lib/posthog-server";
import { getCurrentUserProfile } from "@/lib/profile-server";

// The browser phase runs inside this request (Stagehand's extract() calls execute here, not
// on Browserbase), so the route needs room for: URL resolve + ~75s browser + synthesis.
export const maxDuration = 120;

const BROWSER_DEADLINE_MS = 75_000;
const RESEARCH_FAILED_ERROR = "Company research failed. Please try again.";

const researchSchema = z.object({ jobId: z.uuid() });

type JobRow = {
  id: string;
  run_id: string | null;
  company: string;
  title: string;
  about_role: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
};

// Best-effort, per server instance: stops one user from opening two Browserbase sessions at
// once (the free plan allows one). The button also disables itself while a request is running.
const inFlightUsers = new Set<string>();

export async function POST(req: NextRequest) {
  let lockedUserId: string | null = null;
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
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    const parseResult = researchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    const { jobId } = parseResult.data;

    const { data: job, error: jobError } = await insforge.database
      .from("jobs")
      .select("id, run_id, company, title, about_role, matched_skills, missing_skills")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .maybeSingle<JobRow>();
    if (jobError) {
      console.error("[agent/research]", jobError);
      return NextResponse.json({ success: false, error: RESEARCH_FAILED_ERROR }, { status: 500 });
    }
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    if (inFlightUsers.has(user.id)) {
      return NextResponse.json(
        { success: false, error: "A company research is already running. Please wait for it to finish." },
        { status: 409 },
      );
    }
    inFlightUsers.add(user.id);
    lockedUserId = user.id;

    // Browser phase. Never throws: a failed or empty result just means synthesis runs on the
    // job posting and profile alone.
    let research: CompanyResearchData | null = null;
    const homepage = await resolveCompanyHomepage(job.company);
    if (homepage.url) {
      const outcome = await researchCompanySite(homepage.url, BROWSER_DEADLINE_MS);
      if (outcome.success) {
        research = outcome.data;
      } else {
        const detail = `${outcome.error} (homepage via ${homepage.derivedFrom})`;
        await logAgentError(insforge, job.run_id, user.id, job.id, `Browser research for ${job.company}: ${detail}`, "warning");
      }
    }

    const synthesis = await synthesizeDossier(
      {
        title: job.title,
        company: job.company,
        description: job.about_role ?? "",
        matchedSkills: job.matched_skills ?? [],
        missingSkills: job.missing_skills ?? [],
      },
      profile,
      research,
    );
    if (!synthesis.success) {
      await logAgentError(insforge, job.run_id, user.id, job.id, `Dossier synthesis failed for ${job.company}: ${synthesis.reason}`);
      return NextResponse.json({ success: false, error: RESEARCH_FAILED_ERROR }, { status: 502 });
    }
    const { dossier } = synthesis;

    const { data: updatedRows, error: updateError } = await insforge.database
      .from("jobs")
      .update({ company_research: dossier })
      .eq("id", job.id)
      .eq("user_id", user.id)
      .select("id");
    if (updateError || !updatedRows || updatedRows.length === 0) {
      console.error("[agent/research]", updateError);
      await logAgentError(insforge, job.run_id, user.id, job.id, `Saving dossier failed for ${job.company}`);
      return NextResponse.json({ success: false, error: RESEARCH_FAILED_ERROR }, { status: 500 });
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.id,
      event: "company_researched",
      properties: { userId: user.id, jobId: job.id, company: job.company },
    });
    await flushPostHogSafely(posthog);

    revalidatePath(`/find-jobs/${job.id}`);

    return NextResponse.json({ success: true, data: { dossier } });
  } catch (error) {
    console.error("[agent/research]", error);
    return NextResponse.json({ success: false, error: RESEARCH_FAILED_ERROR }, { status: 500 });
  } finally {
    if (lockedUserId) inFlightUsers.delete(lockedUserId);
  }
}
