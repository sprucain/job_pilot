import type { NormalizedJob } from "@/agent/types";
import { detectCountryFromLocation, searchJobs, type AdzunaJob } from "@/lib/adzuna";
import { logAgentError } from "@/lib/agent-logs";
import type { createInsforgeServer } from "@/lib/insforge-server";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

type DiscoverJobsResult =
  | { success: true; jobs: NormalizedJob[] }
  | { success: false; error: string };

function normalizeJob(job: AdzunaJob): NormalizedJob {
  const salary =
    job.salary_min != null && job.salary_max != null
      ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`
      : null;

  return {
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    salary,
    jobType: job.contract_type || "fulltime",
    aboutRole: job.description,
    sourceUrl: job.redirect_url,
    externalApplyUrl: job.redirect_url,
  };
}

export async function discoverJobs(
  insforge: InsforgeServer,
  runId: string,
  userId: string,
  jobTitle: string,
  location: string,
): Promise<DiscoverJobsResult> {
  try {
    const country = detectCountryFromLocation(location);
    const results = await searchJobs(jobTitle, location, country);
    return { success: true, jobs: results.map(normalizeJob) };
  } catch (error) {
    await logAgentError(insforge, runId, userId, null, `Adzuna search failed: ${String(error)}`);
    return { success: false, error: String(error) };
  }
}
