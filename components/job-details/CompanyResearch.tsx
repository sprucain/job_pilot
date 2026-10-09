import { Building2, Search } from "lucide-react";

type Props = {
  company: string;
};

// Empty state only — Feature 13 (Company Research Agent) enables the button and renders the dossier.
export function CompanyResearch({ company }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between gap-3 border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent">
            <Building2 className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Company Research</h2>
        </div>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground"
        >
          <Search className="h-4 w-4" />
          Research Company
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
          <Building2 className="h-6 w-6" />
        </div>
        <p className="mt-2 text-sm font-medium text-text-primary">No research yet</p>
        <p className="max-w-xs text-sm text-text-muted">
          Click &ldquo;Research Company&rdquo; to let the AI browse {company}&apos;s public pages and build a dossier.
        </p>
      </div>
    </section>
  );
}
