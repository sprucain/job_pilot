"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Sparkles } from "lucide-react";

import { inputClass, labelClass } from "@/lib/form-styles";

type FindJobsResponse =
  | { success: true; data: { totalFound: number; savedCount: number; message: string } }
  | { success: false; error: string };

export function SearchControls() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleFindJobs() {
    if (!jobTitle.trim() || isPending) return;

    setIsPending(true);
    setResultMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/agent/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, location }),
      });
      const result: FindJobsResponse = await response.json();

      if (result.success) {
        setResultMessage(result.data.message);
        router.refresh();
      } else {
        setIsError(true);
        setResultMessage(result.error);
      }
    } catch (error) {
      console.error("[SearchControls]", error);
      setIsError(true);
      setResultMessage("Job search failed. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="jobTitle" className={labelClass}>
            Job Title
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              id="jobTitle"
              type="text"
              placeholder="Frontend Engineer"
              className={`${inputClass} pl-9`}
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <input
            id="location"
            type="text"
            placeholder="Remote, New York..."
            className={inputClass}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            disabled={isPending}
          />
        </div>

        <button
          type="button"
          onClick={handleFindJobs}
          disabled={isPending || !jobTitle.trim()}
          className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Find Jobs
        </button>
      </div>

      {resultMessage && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium ${
            isError ? "bg-error/10 text-error" : "bg-success-lightest text-success-foreground"
          }`}
        >
          {!isError && <Sparkles className="h-4 w-4" />}
          {resultMessage}
        </div>
      )}
    </div>
  );
}
