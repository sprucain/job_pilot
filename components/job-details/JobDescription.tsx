import { ExternalLink, FileText } from "lucide-react";

type Props = {
  description: string;
  jobPostUrl: string | null;
};

// Adzuna's search API hard-caps every description at 500 characters and ends cut-off ones with
// an ellipsis — the full text isn't available from the API (verified live), and Adzuna's own
// listing pages block automated fetches, so the original posting is the only place to read it all.
const TRUNCATION_MARKER = /(…|\.\.\.)\s*$/;

export function JobDescription({ description, jobPostUrl }: Props) {
  const isPreview = TRUNCATION_MARKER.test(description);

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-secondary text-text-secondary">
          <FileText className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">Job Description</h2>
      </div>
      <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-text-primary">
        {description || "No description is available for this job."}
      </p>
      {isPreview && (
        <p className="mt-4 text-sm text-text-muted">
          This is a preview &mdash; Adzuna shares only the first 500 characters of each listing.
          {jobPostUrl && (
            <>
              {" "}
              <a
                href={jobPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-dark"
              >
                Read the full description
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </>
          )}
        </p>
      )}
    </section>
  );
}
