// Shared runtime-narrowing helpers for lenient parsing of GLM 5.2's JSON output —
// used by both lib/resume-extraction.ts and lib/resume-generation.ts so a fix to
// how a missing/malformed field is coerced only has to happen in one place.

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
