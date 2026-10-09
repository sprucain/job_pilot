
export const JOBS_PAGE_SIZE = 20;
const MAX_PAGE = 100_000;

export type MatchFilter = "all" | "high" | "low";
export type JobSort = "matchScore" | "newest" | "oldest";

export type JobQuery = {
  q: string;
  match: MatchFilter;
  sort: JobSort;
  page: number;
};

export const DEFAULT_JOB_QUERY: JobQuery = { q: "", match: "all", sort: "matchScore", page: 1 };

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

// URL params are user-controlled, so every value is validated against its allowed set
// rather than trusted — anything unrecognized falls back to the default.
export function parseJobQuery(params: RawParams): JobQuery {
  const match = first(params.match);
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: first(params.q).trim().slice(0, 100),
    match: match === "high" || match === "low" ? match : "all",
    sort: sort === "newest" || sort === "oldest" ? sort : "matchScore",
    // Capped so an absurd ?page= can't overflow the database's OFFSET.
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
  };
}

// Builds the PostgREST `or` filter for a case-insensitive company/title search.
// Characters that are syntax in a PostgREST filter string (and LIKE wildcards) are
// stripped from the term so user input can't alter the filter structure.
export function buildSearchFilter(q: string): string | null {
  const term = q.replace(/[*%,()"\\]/g, " ").replace(/\s+/g, " ").trim();
  if (!term) return null;
  // `_` is a single-character LIKE wildcard; escape it so it matches literally.
  const escaped = term.replace(/_/g, "\\_");
  return `company.ilike.*${escaped}*,title.ilike.*${escaped}*`;
}

// Omits params equal to their default so URLs stay clean (`/find-jobs` for the default view).
export function buildJobsHref(query: JobQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.match !== DEFAULT_JOB_QUERY.match) params.set("match", query.match);
  if (query.sort !== DEFAULT_JOB_QUERY.sort) params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `/find-jobs?${search}` : "/find-jobs";
}
