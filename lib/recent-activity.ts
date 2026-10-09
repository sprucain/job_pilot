import type { createInsforgeServer } from "@/lib/insforge-server";
import { formatFoundAt } from "@/lib/job-mapping";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

export type ActivityTone = "info" | "success";

export type ActivityEntry = {
  id: string;
  message: string;
  timeAgo: string;
  tone: ActivityTone;
};

export type SearchRunRow = {
  id: string;
  job_title_searched: string | null;
  jobs_found: number;
  started_at: string;
};

export type ResearchedJobRow = {
  id: string;
  company: string;
  researched_at: string;
};

const ACTIVITY_LIMIT = 8;

function describeRun(run: SearchRunRow): string {
  const title = run.job_title_searched?.trim();
  if (run.jobs_found === 0) return title ? `No new matches for ${title}` : "No new matches found";
  const noun = run.jobs_found === 1 ? "job" : "jobs";
  return title ? `Found ${run.jobs_found} ${noun} for ${title}` : `Found ${run.jobs_found} ${noun}`;
}

export function buildActivityEntries(
  runs: SearchRunRow[],
  researched: ResearchedJobRow[],
  now: Date = new Date(),
): ActivityEntry[] {
  const entries = [
    ...runs.map((run) => ({
      at: run.started_at,
      entry: {
        id: `run-${run.id}`,
        message: describeRun(run),
        timeAgo: formatFoundAt(run.started_at, now),
        tone: "success" as const,
      },
    })),
    ...researched.map((job) => ({
      at: job.researched_at,
      entry: {
        id: `research-${job.id}`,
        message: `Researched ${job.company}`,
        timeAgo: formatFoundAt(job.researched_at, now),
        tone: "info" as const,
      },
    })),
  ];

  return entries
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, ACTIVITY_LIMIT)
    .map(({ entry }) => entry);
}

export async function loadRecentActivity(
  insforge: InsforgeServer,
  userId: string,
): Promise<ActivityEntry[] | null> {
  const [runsResult, researchedResult] = await Promise.all([
    insforge.database
      .from("agent_runs")
      .select("id, job_title_searched, jobs_found, started_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(ACTIVITY_LIMIT)
      .returns<SearchRunRow[]>(),
    insforge.database
      .from("jobs")
      .select("id, company, researched_at")
      .eq("user_id", userId)
      .not("researched_at", "is", null)
      .order("researched_at", { ascending: false })
      .limit(ACTIVITY_LIMIT)
      .returns<ResearchedJobRow[]>(),
  ]);

  if (runsResult.error || !runsResult.data || researchedResult.error || !researchedResult.data) {
    console.error("[recent-activity]", runsResult.error, researchedResult.error);
    return null;
  }

  return buildActivityEntries(runsResult.data, researchedResult.data);
}
