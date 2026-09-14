"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";

import { inputClass, labelClass } from "@/lib/form-styles";

type Props = {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (tags: string[]) => void;
};

export function TagInput({ label, placeholder, value, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const inputId = useId();

  function addTag() {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((existing) => existing !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className={`flex-1 ${inputClass}`}
        />
        <button
          type="button"
          onClick={addTag}
          className="rounded-md border border-border bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-border-light"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-3 py-1.5 text-sm text-text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
