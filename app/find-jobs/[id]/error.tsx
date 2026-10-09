"use client";

import Link from "next/link";

type Props = {
  reset: () => void;
};

export default function JobDetailsError({ reset }: Props) {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold text-text-primary">Couldn&apos;t load this job</h1>
        <p className="text-sm text-text-muted">Something went wrong. Please try again.</p>
        <div className="mt-2 flex items-center gap-4">
          <button type="button" onClick={reset} className="text-sm font-medium text-accent hover:text-accent-dark">
            Try again
          </button>
          <Link href="/find-jobs" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            Back to Jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
