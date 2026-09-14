import { Briefcase, Plus, X } from "lucide-react";

import { inputClass, labelClass } from "@/lib/form-styles";
import type { WorkExperienceEntry } from "@/types";

type Props = {
  entries: WorkExperienceEntry[];
  onFieldChange: (id: string, patch: Partial<WorkExperienceEntry>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  canAddMore: boolean;
};

export function WorkExperienceSection({
  entries,
  onFieldChange,
  onRemove,
  onAdd,
  canAddMore,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Work Experience</h3>
        {canAddMore && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add role
          </button>
        )}
      </div>

      {entries.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-muted bg-surface-secondary px-6 py-8 text-center">
          <Briefcase className="h-5 w-5 text-text-muted" aria-hidden />
          <p className="text-sm text-text-muted">No work experience added yet.</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-1 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-border-light"
          >
            Add role
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {entries.map((entry, index) => {
          const companyId = `${entry.id}-company`;
          const titleId = `${entry.id}-title`;
          const startDateId = `${entry.id}-startDate`;
          const endDateId = `${entry.id}-endDate`;
          const responsibilitiesId = `${entry.id}-responsibilities`;

          return (
            <div
              key={entry.id}
              className="relative flex flex-col gap-4 rounded-2xl border border-border bg-surface-secondary p-4"
            >
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  aria-label={`Remove role ${index + 1}`}
                  className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor={companyId} className={labelClass}>
                    Company Name
                  </label>
                  <input
                    id={companyId}
                    type="text"
                    value={entry.company}
                    onChange={(event) => onFieldChange(entry.id, { company: event.target.value })}
                    className={`${inputClass} bg-surface`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={titleId} className={labelClass}>
                    Job Title
                  </label>
                  <input
                    id={titleId}
                    type="text"
                    value={entry.title}
                    onChange={(event) => onFieldChange(entry.id, { title: event.target.value })}
                    className={`${inputClass} bg-surface`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={startDateId} className={labelClass}>
                    Start Date
                  </label>
                  <input
                    id={startDateId}
                    type="month"
                    value={entry.startDate}
                    onChange={(event) =>
                      onFieldChange(entry.id, { startDate: event.target.value })
                    }
                    className={`${inputClass} bg-surface`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor={endDateId} className={labelClass}>
                      End Date
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text-primary">
                      <input
                        type="checkbox"
                        checked={entry.current}
                        onChange={(event) =>
                          onFieldChange(entry.id, {
                            current: event.target.checked,
                            endDate: event.target.checked ? "" : entry.endDate,
                          })
                        }
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                      Currently working here
                    </label>
                  </div>
                  <input
                    id={endDateId}
                    type="month"
                    value={entry.endDate}
                    disabled={entry.current}
                    onChange={(event) => onFieldChange(entry.id, { endDate: event.target.value })}
                    className={`${inputClass} ${
                      entry.current ? "cursor-not-allowed bg-surface-secondary" : "bg-surface"
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={responsibilitiesId} className={labelClass}>
                  Key Responsibilities
                </label>
                <textarea
                  id={responsibilitiesId}
                  value={entry.responsibilities}
                  onChange={(event) =>
                    onFieldChange(entry.id, { responsibilities: event.target.value })
                  }
                  rows={3}
                  className={`${inputClass} resize-y bg-surface`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
