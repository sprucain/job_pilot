import { Building2, SearchX } from "lucide-react";
import Link from "next/link";

import { getSourceBadgeClass, getSourceBadgeLabel } from "@/lib/job-source";
import { getMatchScoreBarClass } from "@/lib/match-score";
import type { Job } from "@/types";

type Props = {
  jobs: Job[];
  isFiltered?: boolean;
};

const columnHeaderClass = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary";

export function JobsTable({ jobs, isFiltered = false }: Props) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className={columnHeaderClass}>Company</th>
          <th className={columnHeaderClass}>Role</th>
          <th className={columnHeaderClass}>Match Score</th>
          <th className={columnHeaderClass}>Salary Est.</th>
          <th className={columnHeaderClass}>Source</th>
          <th className={columnHeaderClass}>Date Found</th>
        </tr>
      </thead>
      <tbody>
        {jobs.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-16">
              <div className="flex flex-col items-center gap-2 text-center">
                <SearchX className="h-6 w-6 text-text-muted" />
                <p className="text-sm text-text-muted">
                  {isFiltered
                    ? "No jobs match your filters. Try a different search or match level."
                    : "No jobs found yet. Run a search above to find your first matches."}
                </p>
              </div>
            </td>
          </tr>
        ) : (
          jobs.map((job) => (
            <tr key={job.id} className="border-b border-border last:border-b-0 hover:bg-surface-secondary">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-secondary text-text-secondary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <Link href={`/find-jobs/${job.id}`} className="text-sm font-medium text-text-primary hover:text-accent">
                    {job.company}
                  </Link>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-text-primary">
                <Link href={`/find-jobs/${job.id}`} className="hover:text-accent">
                  {job.title}
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-24 flex-shrink-0 overflow-hidden rounded-full bg-border-light">
                    <div
                      className={`h-full rounded-full ${getMatchScoreBarClass(job.matchScore)}`}
                      style={{ width: `${job.matchScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{job.matchScore}%</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-text-primary">{job.salary}</td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getSourceBadgeClass(job.source)}`}
                >
                  {getSourceBadgeLabel(job.source)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-text-secondary">{job.foundAt}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
