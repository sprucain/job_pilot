import { asString, asStringArray } from "@/lib/json-normalize";
import type { CompanyDossier, Job, JobDetail, JobSource } from "@/types";

// Only the columns this feature actually reads/writes. architecture.md's full `jobs`
// schema has several more columns (responsibilities, requirements, nice_to_have,
// benefits, about_company, company_research) that Feature 10 never populates —
// Adzuna only supplies a description snippet, not structured versions of those —
// so they're left out here rather than modeled as always-null fields.
export type JobRow = {
  id: string;
  company: string;
  title: string;
  match_score: number;
  salary: string | null;
  source: JobSource;
  found_at: string;
};

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Mirrors the mockup's relative-time style ("2 hours ago", "Yesterday", "3 days ago")
// from Feature 09 — mock data hardcoded these strings, this derives them from the
// real found_at timestamp instead.
export function formatFoundAt(foundAtIso: string, now: Date = new Date()): string {
  const elapsedMs = now.getTime() - new Date(foundAtIso).getTime();
  if (elapsedMs < HOUR_MS) {
    const minutes = Math.max(1, Math.floor(elapsedMs / MINUTE_MS));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (elapsedMs < DAY_MS) {
    const hours = Math.floor(elapsedMs / HOUR_MS);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(elapsedMs / DAY_MS);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function mapJobRowToUi(row: JobRow): Job {
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    matchScore: row.match_score,
    salary: row.salary ?? "Not listed",
    source: row.source,
    foundAt: formatFoundAt(row.found_at),
  };
}

export const JOB_DETAIL_COLUMNS =
  "id, company, title, match_score, match_reason, matched_skills, missing_skills, salary, location, job_type, about_role, source_url, external_apply_url, company_research, found_at";

export type JobDetailRow = {
  id: string;
  company: string;
  title: string;
  match_score: number;
  match_reason: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  salary: string | null;
  location: string | null;
  job_type: string | null;
  about_role: string | null;
  source_url: string | null;
  external_apply_url: string | null;
  company_research: unknown;
  found_at: string;
};

const JOB_TYPE_LABELS: Record<string, string> = {
  fulltime: "Full-time",
  full_time: "Full-time",
  parttime: "Part-time",
  part_time: "Part-time",
  contract: "Contract",
  permanent: "Permanent",
};

// URLs come from a third-party API and end up in an href, so only http(s) is ever linked
// (rules out `javascript:` and similar schemes).
function safeExternalUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// Skills are rendered keyed by name, and the model can repeat one — dedupe (case-insensitive).
function uniqueSkills(skills: string[] | null): string[] {
  const seen = new Set<string>();
  return (skills ?? []).filter((skill) => {
    const key = skill.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// jsonb comes back untyped — coerce field by field so a malformed or partial row can never
// crash the page. Returns null when nothing usable was stored (renders the empty state).
export function normalizeCompanyDossier(value: unknown): CompanyDossier | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const dossier: CompanyDossier = {
    companyOverview: asString(raw.companyOverview),
    techStack: asStringArray(raw.techStack),
    culture: asStringArray(raw.culture),
    whyThisRole: asString(raw.whyThisRole),
    yourEdge: asStringArray(raw.yourEdge),
    gapsToAddress: asStringArray(raw.gapsToAddress),
    smartQuestions: asStringArray(raw.smartQuestions),
    interviewPrep: asStringArray(raw.interviewPrep),
    sources: asStringArray(raw.sources),
  };
  const hasContent = Object.values(dossier).some((field) => (Array.isArray(field) ? field.length > 0 : field !== ""));
  return hasContent ? dossier : null;
}

export function mapJobRowToDetail(row: JobDetailRow): JobDetail {
  const jobPostUrl = safeExternalUrl(row.source_url);
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    matchScore: row.match_score,
    matchReason: row.match_reason ?? "",
    matchedSkills: uniqueSkills(row.matched_skills),
    missingSkills: uniqueSkills(row.missing_skills),
    // The mockup shows an en dash between the bounds; Adzuna salaries are stored with a hyphen.
    salary: row.salary ? row.salary.replace(" - ", " – ") : "Not listed",
    location: row.location || "Not listed",
    jobType: row.job_type ? (JOB_TYPE_LABELS[row.job_type.toLowerCase()] ?? row.job_type) : "—",
    foundAt: formatFoundAt(row.found_at),
    description: row.about_role ?? "",
    jobPostUrl,
    applyUrl: safeExternalUrl(row.external_apply_url) ?? jobPostUrl,
    companyResearch: normalizeCompanyDossier(row.company_research),
  };
}
