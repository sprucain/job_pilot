import type { JobSource } from "@/types";

// No mockup covers this badge (context/designs/find-jobs.png's table omits the
// Source column entirely — see progress-tracker.md's Feature 09 /review entry).
// "search" is the only value any built feature can currently produce — manual
// URL import is out of scope per project-overview.md — but the badge still
// needs to render correctly for the "url" case since it's a valid DB value.
export function getSourceBadgeLabel(source: JobSource): string {
  return source === "search" ? "Search" : "URL";
}

export function getSourceBadgeClass(source: JobSource): string {
  return source === "search"
    ? "bg-info-lightest text-info-foreground"
    : "bg-surface-secondary text-text-secondary";
}
