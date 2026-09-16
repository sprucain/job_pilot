import { RESUME_GENERATION_FAILED_ERROR } from "@/lib/constants";
import { asString } from "@/lib/json-normalize";
import { callVeniceJson } from "@/lib/venice-json";
import type { Profile, WorkExperienceEntry } from "@/types";

export type GeneratedResumeContent = {
  summary: string;
  workExperience: { bullets: string[] }[];
};

export const MAX_GENERATED_BULLETS_PER_ROLE = 4;

const TRUNCATED_ERROR =
  "Resume generation produced too much content to finish. Try shortening your work experience descriptions and try again.";

const SYSTEM_PROMPT = `You are a professional resume writer. Given a candidate's profile, write clean, professional resume content and return only valid JSON matching this schema:

{
  "summary": string,
  "workExperience": [{ "title": string, "company": string, "bullets": string[] }]
}

"summary" is a concise 2-3 sentence professional summary paragraph highlighting the candidate's experience level, current title, and strongest skills.
"workExperience" must contain exactly one entry per role listed in the candidate's work history below, in the same order. For each entry, echo back that role's exact "title" and "company" as given (do not reword them) alongside up to ${MAX_GENERATED_BULLETS_PER_ROLE} polished, achievement-oriented bullet points rewritten from that role's raw responsibilities. Keep each bullet to one concise line. Never invent employers, titles, dates, or accomplishments that aren't implied by the input.`;

function buildUserPrompt(profile: Profile): string {
  const roles = profile.workExperience
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.title} at ${entry.company} (${entry.startDate} - ${entry.current ? "Present" : entry.endDate})\nRaw responsibilities: ${entry.responsibilities || "N/A"}`,
    )
    .join("\n\n");

  return `CANDIDATE
Name: ${profile.fullName}
Current title: ${profile.currentTitle || "N/A"}
Experience level: ${profile.experienceLevel}
Years of experience: ${profile.yearsExperience}
Skills: ${profile.skills.join(", ") || "N/A"}
Industries: ${profile.industries.join(", ") || "N/A"}

WORK EXPERIENCE (in order — return exactly ${profile.workExperience.length} workExperience entries, in this same order, each echoing its title/company back exactly)
${roles}`;
}

type GenerationResult =
  | { success: true; data: GeneratedResumeContent }
  | { success: false; error: string };

export async function generateResumeContent(profile: Profile): Promise<GenerationResult> {
  const result = await callVeniceJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(profile),
    temperature: 0.7,
    maxTokens: 1000,
  });

  if (!result.success) {
    if (result.reason === "truncated") {
      return { success: false, error: TRUNCATED_ERROR };
    }
    return { success: false, error: RESUME_GENERATION_FAILED_ERROR };
  }

  return { success: true, data: normalizeGeneratedContent(result.data, profile.workExperience) };
}

// GLM 5.2's JSON output is trusted for shape but not for positional alignment — the
// model is asked to echo each role's title/company back alongside its bullets so a
// reordered or skipped role (e.g. the model defaulting to reverse-chronological
// despite being told to keep the input order) can be detected instead of silently
// zipping bullets written for one role onto a different one. A role whose echo
// doesn't match (or that GLM omitted) falls back to a naive split of its own raw
// responsibilities text, so the PDF always shows *something* for every role rather
// than either nothing or a misattributed bullet list.
function normalizeGeneratedContent(
  parsed: Record<string, unknown>,
  workExperience: WorkExperienceEntry[],
): GeneratedResumeContent {
  const summary = asString(parsed.summary);
  const rawWorkExperience = Array.isArray(parsed.workExperience) ? parsed.workExperience : [];

  const normalizedRoles = workExperience.map((entry, index) => {
    // rawWorkExperience[index] is `unknown` — safe to read as a plain record because
    // every field access below goes through asString, which narrows unknown -> string
    // with a runtime typeof check.
    const record = (rawWorkExperience[index] ?? {}) as Record<string, unknown>;
    return { bullets: extractVerifiedBullets(record, entry) };
  });

  return { summary, workExperience: normalizedRoles };
}

function extractVerifiedBullets(record: Record<string, unknown>, entry: WorkExperienceEntry): string[] {
  const titleMatches = normalizeForCompare(asString(record.title)) === normalizeForCompare(entry.title);
  const companyMatches = normalizeForCompare(asString(record.company)) === normalizeForCompare(entry.company);

  if (titleMatches && companyMatches) {
    const bullets = Array.isArray(record.bullets)
      ? record.bullets
          .filter((item): item is string => typeof item === "string")
          .slice(0, MAX_GENERATED_BULLETS_PER_ROLE)
      : [];
    if (bullets.length > 0) return bullets;
  }

  return fallbackBulletsFromResponsibilities(entry.responsibilities);
}

function normalizeForCompare(value: string): string {
  return value.trim().toLowerCase();
}

function fallbackBulletsFromResponsibilities(responsibilities: string): string[] {
  return responsibilities
    .split(/\n+|(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, MAX_GENERATED_BULLETS_PER_ROLE);
}
