"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buildJobsHref, type JobQuery } from "@/lib/job-query";

const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  query: JobQuery;
};

// All filter/sort/search state lives in the URL so the server component does the querying;
// any change resets to page 1 since the old page number may not exist in the new result set.
export function JobFilters({ query }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(query.q);
  const queryRef = useRef(query);
  const lastPushedSearch = useRef(query.q);
  useEffect(() => {
    queryRef.current = query;
    // The URL changed to a search this component didn't push (e.g. browser back/forward) —
    // mirror it into the input so the box never disagrees with the results shown.
    if (query.q !== lastPushedSearch.current) {
      lastPushedSearch.current = query.q;
      setSearch(query.q);
    }
  }, [query]);

  useEffect(() => {
    if (search.trim() === queryRef.current.q) return;
    const timer = setTimeout(() => {
      lastPushedSearch.current = search.trim();
      router.replace(buildJobsHref({ ...queryRef.current, q: search.trim(), page: 1 }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, router]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by company or role..."
          aria-label="Filter by company or role"
          className="w-full rounded-md border-0 bg-transparent py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={query.match}
          onChange={(event) =>
            // Safe: every <option> value below is a MatchFilter member.
            router.push(buildJobsHref({ ...query, match: event.target.value as JobQuery["match"], page: 1 }))
          }
          aria-label="Filter by match level"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">All Matches</option>
          <option value="high">High Match</option>
          <option value="low">Low Match</option>
        </select>

        <select
          value={query.sort}
          onChange={(event) =>
            // Safe: every <option> value below is a JobSort member.
            router.push(buildJobsHref({ ...query, sort: event.target.value as JobQuery["sort"], page: 1 }))
          }
          aria-label="Sort jobs"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="matchScore">Match Score</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </div>
  );
}
