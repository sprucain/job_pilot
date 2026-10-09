import type { JobScore, NormalizedJob } from "@/agent/types";
import { logAgentError } from "@/lib/agent-logs";
import type { createInsforgeServer } from "@/lib/insforge-server";
import { asNumber, asString, asStringArray } from "@/lib/json-normalize";
import { callVeniceJson } from "@/lib/venice-json";
import type { Profile } from "@/types";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

type ScoreJobResult = { success: true; score: JobScore } | { success: false; error: string };

const SYSTEM_PROMPT = `You are a job matching assistant. Compare a candidate's profile against a job posting and return only valid JSON matching this schema:

{
  "matchScore": number,
  "matchReason": string,
  "matchedSkills": string[],
  "missingSkills": string[]
}

"matchScore" is an integer 0-100 rating how well the candidate fits this specific role. "matchReason" is one concise paragraph explaining the score. "matchedSkills" are skills the candidate already has that this job asks for. "missingSkills" are skills the job asks for that the candidate's profile doesn't show. Never invent skills that aren't in the job description or the candidate's profile.`;

function buildUserPrompt(job: NormalizedJob, profile: Profile): string {
  return `JOB POSTING
Title: ${job.title}
Company: ${job.company}
Description: ${job.aboutRole}

CANDIDATE PROFILE
Current title: ${profile.currentTitle || "N/A"}
Experience level: ${profile.experienceLevel}
Years of experience: ${profile.yearsExperience}
Skills: ${profile.skills.join(", ") || "N/A"}
Industries: ${profile.industries.join(", ") || "N/A"}`;
}

function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export async function scoreJob(
  insforge: InsforgeServer,
  runId: string,
  userId: string,
  job: NormalizedJob,
  profile: Profile,
): Promise<ScoreJobResult> {
  try {
    const result = await callVeniceJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(job, profile),
      temperature: 0.3,
      maxTokens: 300,
    });

    if (!result.success) {
      await logAgentError(insforge, runId, userId, null, `Scoring failed for "${job.title}" at ${job.company}: ${result.reason}`);
      return { success: false, error: result.reason };
    }

    return {
      success: true,
      score: {
        matchScore: clampScore(asNumber(result.data.matchScore)),
        matchReason: asString(result.data.matchReason),
        matchedSkills: asStringArray(result.data.matchedSkills),
        missingSkills: asStringArray(result.data.missingSkills),
      },
    };
  } catch (error) {
    await logAgentError(insforge, runId, userId, null, `Scoring failed for "${job.title}" at ${job.company}: ${String(error)}`);
    return { success: false, error: String(error) };
  }
}
