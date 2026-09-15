import type { ExperienceLevel } from "@/types";

export const EXPERIENCE_LEVEL_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

export function experienceLevelLabel(value: ExperienceLevel): string {
  return EXPERIENCE_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
