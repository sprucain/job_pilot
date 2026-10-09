import Link from "next/link";
import { Fragment } from "react";

import { buildJobsHref, type JobQuery } from "@/lib/job-query";

type Props = {
  query: JobQuery;
  currentPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  totalResults: number;
};

const pageButtonClass =
  "flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-text-primary hover:bg-surface-secondary";
const activePageButtonClass =
  "flex h-9 min-w-9 items-center justify-center rounded-md border border-accent bg-accent-light px-3 text-sm font-medium text-accent";
const navButtonClass =
  "flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-text-primary hover:bg-surface-secondary disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent";

// Always shows pages 1-3, the current page, and the last page (deduped, sorted),
// with an ellipsis wherever two shown pages aren't consecutive — reduces to the
// mockup's exact "1, 2, 3, …, last" for currentPage 1-3, but unlike a hardcoded
// [1,2,3,...,last] list, this guarantees the current page always has a visible,
// correctly-highlighted button no matter what page a caller passes. // links are plain <Link>s to the same URL with a different `page` param.
export function JobsPagination({ query, currentPage, totalPages, rangeStart, rangeEnd, totalResults }: Props) {
  const pages = Array.from(new Set([1, 2, 3, currentPage, totalPages]))
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const hrefFor = (page: number) => buildJobsHref({ ...query, page });

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-6 py-4 sm:flex-row">
      <p className="text-sm text-text-secondary">
        Showing <span className="font-semibold text-text-primary">{rangeStart}</span> to{" "}
        <span className="font-semibold text-text-primary">{rangeEnd}</span> of{" "}
        <span className="font-semibold text-text-primary">{totalResults}</span> results
      </p>

      <div className="flex items-center gap-2">
        {currentPage <= 1 ? (
          <span aria-disabled="true" className={`${navButtonClass} cursor-not-allowed text-text-muted`}>
            Previous
          </span>
        ) : (
          <Link href={hrefFor(currentPage - 1)} className={navButtonClass}>
            Previous
          </Link>
        )}

        {pages.map((page, index) => {
          const previousPage = pages[index - 1];
          const hasGapBefore = previousPage !== undefined && page - previousPage > 1;
          return (
            <Fragment key={page}>
              {hasGapBefore && <span className="px-1 text-sm text-text-muted">...</span>}
              <Link
                href={hrefFor(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={page === currentPage ? activePageButtonClass : pageButtonClass}
              >
                {page}
              </Link>
            </Fragment>
          );
        })}

        {currentPage >= totalPages ? (
          <span aria-disabled="true" className={`${navButtonClass} cursor-not-allowed text-text-muted`}>
            Next
          </span>
        ) : (
          <Link href={hrefFor(currentPage + 1)} className={navButtonClass}>
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
