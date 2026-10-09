import { Briefcase, Building2, Calendar, DollarSign, ExternalLink, MapPin } from "lucide-react";

import type { JobDetail } from "@/types";

type Props = {
  job: JobDetail;
};

const cardClass =
  "rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]";

const infoCards = (job: JobDetail) => [
  { label: "Salary Est.", value: job.salary, Icon: DollarSign, iconClass: "bg-success-lightest text-success" },
  { label: "Location", value: job.location, Icon: MapPin, iconClass: "bg-info-lightest text-info-medium" },
  { label: "Job Type", value: job.jobType, Icon: Briefcase, iconClass: "bg-accent-light text-accent" },
  { label: "Date Found", value: job.foundAt, Icon: Calendar, iconClass: "bg-surface-secondary text-text-secondary" },
];

export function JobInfo({ job }: Props) {
  return (
    <>
      <div className={`${cardClass} flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary text-text-secondary">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-text-primary">{job.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span>{job.company}</span>
              <span aria-hidden="true" className="text-text-muted">
                •
              </span>
              <span className="rounded-full bg-success-lightest px-2.5 py-0.5 text-xs font-medium text-success-dark">
                {job.matchScore}% Match Score
              </span>
            </div>
          </div>
        </div>

        {job.jobPostUrl && (
          <a
            href={job.jobPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            View Job Post
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {infoCards(job).map(({ label, value, Icon, iconClass }) => (
          <div key={label} className={`${cardClass} flex items-center gap-3 p-4`}>
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary" title={value}>
                {value}
              </p>
              <p className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
