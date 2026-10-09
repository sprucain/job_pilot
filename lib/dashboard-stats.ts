import type { createInsforgeServer } from "@/lib/insforge-server";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

export type TrendTone = "up" | "down" | "flat";

export type TrendStat = {
  label: string;
  value: string;
  trend: string;
  trendTone: TrendTone;
  trendLabel: string;
};

export type CaptionStat = {
  label: string;
  value: string;
  caption: string;
};

export type DashboardStat = TrendStat | CaptionStat;

export type JobScoreRow = {
  match_score: number;
  found_at: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
// PostgREST caps a response at 1000 rows by default, so the average pages through.
const PAGE_SIZE = 1000;

function average(rows: JobScoreRow[]): number | null {
  if (rows.length === 0) return null;
  return rows.reduce((sum, row) => sum + row.match_score, 0) / rows.length;
}

function formatSigned(value: number, suffix: string): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix}`;
}

function toneOf(value: number): TrendTone {
  const rounded = Math.round(value);
  if (rounded > 0) return "up";
  if (rounded < 0) return "down";
  return "flat";
}

// Trends compare the last 7 days with the 7 days before them; with nothing in the
// earlier window there is no baseline, so the card falls back to a plain caption.
export function computeDashboardStats(
  rows: JobScoreRow[],
  companiesResearched: number,
  now: Date = new Date(),
): DashboardStat[] {
  const weekStart = now.getTime() - WEEK_MS;
  const prevWeekStart = weekStart - WEEK_MS;
  const thisWeek = rows.filter((row) => new Date(row.found_at).getTime() >= weekStart);
  const prevWeek = rows.filter((row) => {
    const time = new Date(row.found_at).getTime();
    return time >= prevWeekStart && time < weekStart;
  });

  const overallAverage = average(rows);
  const thisWeekAverage = average(thisWeek);
  const prevWeekAverage = average(prevWeek);

  const totalJobs: DashboardStat =
    prevWeek.length > 0
      ? (() => {
          const change = ((thisWeek.length - prevWeek.length) / prevWeek.length) * 100;
          return {
            label: "Total Jobs Found",
            value: String(rows.length),
            trend: formatSigned(change, "%"),
            trendTone: toneOf(change),
            trendLabel: "vs last week",
          };
        })()
      : { label: "Total Jobs Found", value: String(rows.length), caption: "All time" };

  const avgMatch: DashboardStat =
    overallAverage === null
      ? { label: "Avg. Match Rate", value: "—", caption: "No jobs yet" }
      : thisWeekAverage !== null && prevWeekAverage !== null
        ? {
            label: "Avg. Match Rate",
            value: `${Math.round(overallAverage)}%`,
            trend: formatSigned(thisWeekAverage - prevWeekAverage, "%"),
            trendTone: toneOf(thisWeekAverage - prevWeekAverage),
            trendLabel: "vs last week",
          }
        : { label: "Avg. Match Rate", value: `${Math.round(overallAverage)}%`, caption: "All time" };

  return [
    totalJobs,
    avgMatch,
    { label: "Companies Researched", value: String(companiesResearched), caption: "Total researched" },
    { label: "Jobs This Week", value: String(thisWeek.length), caption: "New this week" },
  ];
}

export async function loadDashboardStats(
  insforge: InsforgeServer,
  userId: string,
): Promise<DashboardStat[] | null> {
  const researched = await insforge.database
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("company_research", "is", null);
  if (researched.error) {
    console.error("[dashboard-stats] researched count", researched.error);
    return null;
  }

  const rows: JobScoreRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await insforge.database
      .from("jobs")
      .select("match_score, found_at")
      .eq("user_id", userId)
      .order("found_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<JobScoreRow[]>();
    if (error || !data) {
      console.error("[dashboard-stats] jobs", error);
      return null;
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return computeDashboardStats(rows, researched.count ?? 0);
}
