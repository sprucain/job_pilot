"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";

import type { CompanyDossier } from "@/types";

type Props = {
  jobId: string;
  company: string;
  dossier: CompanyDossier | null;
};

type ResearchResponse = { success: true; data: { dossier: CompanyDossier } } | { success: false; error: string };

const sectionLabelClass = "text-xs font-medium uppercase tracking-wide text-text-secondary";

// Source URLs are stored data, so only http(s) is ever linked.
function safeHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="flex gap-2 text-sm leading-relaxed text-text-primary">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function DossierSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className={sectionLabelClass}>{title}</h3>
      {children}
    </div>
  );
}

function Dossier({ dossier }: { dossier: CompanyDossier }) {
  const sources = dossier.sources
    .map((source) => safeHttpUrl(source))
    .filter((url): url is URL => url !== null);

  return (
    <div className="flex flex-col gap-6 p-6">
      {dossier.companyOverview && (
        <DossierSection title="Company Overview">
          <p className="mt-3 text-base leading-relaxed text-text-primary">{dossier.companyOverview}</p>
        </DossierSection>
      )}

      {dossier.techStack.length > 0 && (
        <DossierSection title="Tech Stack">
          <ul className="mt-3 flex flex-wrap gap-2">
            {dossier.techStack.map((tech, index) => (
              <li
                key={`${index}-${tech}`}
                className="rounded-full bg-surface-secondary px-3 py-1 text-sm font-medium text-text-secondary"
              >
                {tech}
              </li>
            ))}
          </ul>
        </DossierSection>
      )}

      {dossier.culture.length > 0 && (
        <DossierSection title="Culture">
          <BulletList items={dossier.culture} />
        </DossierSection>
      )}

      {dossier.whyThisRole && (
        <DossierSection title="Why This Role">
          <p className="mt-3 text-base leading-relaxed text-text-primary">{dossier.whyThisRole}</p>
        </DossierSection>
      )}

      {dossier.yourEdge.length > 0 && (
        <div className="rounded-xl bg-accent-light p-5">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-xs font-medium uppercase tracking-wide">Your Edge</h3>
          </div>
          <BulletList items={dossier.yourEdge} />
        </div>
      )}

      {dossier.gapsToAddress.length > 0 && (
        <DossierSection title="Gaps to Address">
          <BulletList items={dossier.gapsToAddress} />
        </DossierSection>
      )}

      {dossier.smartQuestions.length > 0 && (
        <DossierSection title="Smart Questions to Ask">
          <BulletList items={dossier.smartQuestions} />
        </DossierSection>
      )}

      {dossier.interviewPrep.length > 0 && (
        <DossierSection title="Interview Prep">
          <BulletList items={dossier.interviewPrep} />
        </DossierSection>
      )}

      <div className="border-t border-border pt-4">
        <h3 className={sectionLabelClass}>Sources</h3>
        {sources.length === 0 ? (
          <p className="mt-2 text-xs text-text-muted">
            The company&apos;s website couldn&apos;t be read, so this briefing is based on the job posting and your profile.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {sources.map((url) => (
              <li key={url.toString()} className="text-xs">
                <a
                  href={url.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-text-muted underline hover:text-text-primary"
                >
                  {url.hostname}
                  {url.pathname === "/" ? "" : url.pathname}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function CompanyResearch({ jobId, company, dossier }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResearch() {
    if (isPending) return;
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const result: ResearchResponse = await response.json();

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (caught) {
      console.error("[CompanyResearch]", caught);
      setError("Company research failed. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  const ButtonIcon = isPending ? Loader2 : dossier ? RefreshCw : Search;

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
          onClick={handleResearch}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ButtonIcon className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Researching…" : dossier ? "Re-run Research" : "Research Company"}
        </button>
      </div>

      {error && (
        <div role="alert" className="mx-6 mt-6 rounded-md bg-error/10 px-4 py-3 text-sm font-medium text-error">
          {error}
        </div>
      )}

      {isPending && (
        <p role="status" className="px-6 pt-6 text-sm text-text-muted">
          Browsing {company}&apos;s public pages and building your briefing — this can take up to a minute or two.
        </p>
      )}

      {dossier ? (
        <Dossier dossier={dossier} />
      ) : (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="mt-2 text-sm font-medium text-text-primary">No research yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Click &ldquo;Research Company&rdquo; to let the AI browse {company}&apos;s public pages and build a dossier.
          </p>
        </div>
      )}
    </section>
  );
}
