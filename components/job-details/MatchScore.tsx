import { Check, Sparkles, X } from "lucide-react";

import type { JobDetail } from "@/types";

type Props = {
  job: JobDetail;
};

const cardClass =
  "rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6";

const sectionLabelClass = "text-xs font-medium uppercase tracking-wide text-text-secondary";
const skillGroupLabelClass = "text-sm text-text-muted";

export function MatchScore({ job }: Props) {
  return (
    <>
      <section className={cardClass}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-lightest text-success">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className={sectionLabelClass}>AI Match Reasoning</h2>
        </div>
        <p className="mt-4 text-base leading-relaxed text-text-primary">
          {job.matchReason || "No match reasoning was recorded for this job."}
        </p>
      </section>

      <section className={cardClass}>
        <h2 className={sectionLabelClass}>Required Skills vs Your Profile</h2>

        <p className={`mt-5 ${skillGroupLabelClass}`}>You have</p>
        {job.matchedSkills.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No matching skills identified.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {job.matchedSkills.map((skill) => (
              <li
                key={skill}
                className="flex items-center gap-1.5 rounded-full bg-success-lightest px-3 py-1 text-sm font-medium text-success-dark"
              >
                <Check className="h-3.5 w-3.5" />
                {skill}
              </li>
            ))}
          </ul>
        )}

        <p className={`mt-5 ${skillGroupLabelClass}`}>Gap skills</p>
        {job.missingSkills.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No skill gaps identified.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {job.missingSkills.map((skill) => (
              <li
                key={skill}
                className="flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent"
              >
                <X className="h-3.5 w-3.5" />
                {skill}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
