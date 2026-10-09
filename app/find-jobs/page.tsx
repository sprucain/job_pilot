import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { JobFilters } from "@/components/find-jobs/JobFilters";
import { JobsPagination } from "@/components/find-jobs/JobsPagination";
import { JobsTable } from "@/components/find-jobs/JobsTable";
import { SearchControls } from "@/components/find-jobs/SearchControls";
import { createInsforgeServer } from "@/lib/insforge-server";
import { mapJobRowToUi, type JobRow } from "@/lib/job-mapping";
import { JOBS_PAGE_SIZE as PAGE_SIZE, buildSearchFilter, parseJobQuery } from "@/lib/job-query";
import { MATCH_THRESHOLD } from "@/lib/constants";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FindJobsPage({ searchParams }: Props) {
  const query = parseJobQuery(await searchParams);
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) redirect("/login");

  const userId = data.user.id;
  const runQuery = (page: number) => {
    let builder = insforge.database
      .from("jobs")
      .select("id, company, title, match_score, salary, source, found_at", { count: "exact" })
      .eq("user_id", userId);

    if (query.match === "high") builder = builder.gte("match_score", MATCH_THRESHOLD);
    if (query.match === "low") builder = builder.lt("match_score", MATCH_THRESHOLD);

    const searchFilter = buildSearchFilter(query.q);
    if (searchFilter) builder = builder.or(searchFilter);

    // `id` is a final tiebreaker so rows with equal scores/timestamps can't shuffle between pages.
    if (query.sort === "matchScore") {
      builder = builder.order("match_score", { ascending: false }).order("found_at", { ascending: false });
    } else {
      builder = builder.order("found_at", { ascending: query.sort === "oldest" });
    }

    return builder
      .order("id", { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .returns<JobRow[]>();
  };

  let currentPage = query.page;
  let result = await runQuery(currentPage);

  // A stale or hand-edited ?page= past the last page makes PostgREST answer 416 with no row
  // count, so re-query page 1 to learn the real total, then jump to the true last page.
  if (result.error && currentPage > 1) {
    currentPage = 1;
    result = await runQuery(currentPage);
    const lastPage = Math.max(1, Math.ceil((result.count ?? 0) / PAGE_SIZE));
    if (!result.error && lastPage > 1) {
      currentPage = Math.min(query.page, lastPage);
      if (currentPage > 1) result = await runQuery(currentPage);
    }
  }

  const hasActiveFilters = query.q !== "" || query.match !== "all";
  const loadFailed = Boolean(result.error);
  const jobRows = result.data;
  const totalResults = result.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  const jobs = (jobRows ?? []).map(mapJobRowToUi);
  const rangeStart = totalResults === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalResults);

  return (
    <>
      <Navbar isAuthenticated activeRoute="/find-jobs" />
      <main className="flex-1 bg-background">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-8 py-8">
          <SearchControls />

          <JobFilters query={query} />

          {loadFailed && (
            <p role="alert" className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
              Couldn&apos;t load your jobs. Please refresh and try again.
            </p>
          )}

          <div className="rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
            <div className="overflow-x-auto">
              <JobsTable jobs={jobs} isFiltered={hasActiveFilters} />
            </div>
            <div className="border-t border-border">
              <JobsPagination
                query={query}
                currentPage={currentPage}
                totalPages={totalPages}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                totalResults={totalResults}
              />
            </div>
          </div>

          <p className="text-center text-xs text-text-muted">
            Jobs by{" "}
            <a
              href="https://www.adzuna.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              Adzuna
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
