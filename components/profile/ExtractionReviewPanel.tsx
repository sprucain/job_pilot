"use client";

import { useState } from "react";

import type { FieldConflict } from "@/lib/extraction-review";

type Props = {
  conflicts: FieldConflict[];
  onApply: (acceptedFields: Set<string>) => void;
  onDiscard: () => void;
};

export function ExtractionReviewPanel({ conflicts, onApply, onDiscard }: Props) {
  const [accepted, setAccepted] = useState<Set<string>>(() => new Set(conflicts.map((c) => c.field)));

  function toggle(field: string) {
    setAccepted((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  return (
    <div className="mb-6 rounded-md border border-accent-light bg-accent-muted p-4">
      <p className="text-sm font-semibold text-text-primary">Review extracted changes</p>
      <p className="mt-1 text-sm text-text-secondary">
        These fields already have a value. Choose which ones to replace with what was found in your resume.
      </p>

      <div className="mt-4 flex flex-col divide-y divide-border border-t border-b border-border">
        {conflicts.map((conflict) => (
          <label key={conflict.field} className="flex items-start gap-3 px-1 py-3">
            <input
              type="checkbox"
              checked={accepted.has(conflict.field)}
              onChange={() => toggle(conflict.field)}
              className="mt-1"
            />
            <div className="flex-1 text-sm">
              <p className="font-medium text-text-primary">{conflict.label}</p>
              <p className="mt-0.5 text-text-muted line-through">{conflict.oldSummary}</p>
              <p className="text-text-primary">{conflict.newSummary}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => onApply(accepted)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark"
        >
          Apply Selected
        </button>
      </div>
    </div>
  );
}
