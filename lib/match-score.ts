// Thresholds and colors reverse-engineered from context/designs/find-jobs.png's actual
// pixel values (94/96/91% = --color-success-alt, 88/85% = --color-info-medium, 72% =
// --color-warning) — see progress-tracker.md's Feature 09 entry. ui-tokens.md's Match
// Score Colors table and ui-rules.md's Match Score Bar section both documented different
// thresholds/hex values that didn't match the mockup; both were corrected to this.
export function getMatchScoreBarClass(score: number): string {
  if (score >= 90) return "bg-success-alt";
  if (score >= 80) return "bg-info-medium";
  return "bg-warning";
}
