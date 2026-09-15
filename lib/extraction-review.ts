import { experienceLevelLabel } from "@/lib/profile-options";
import type { Education, ExtractedProfileFields, Profile, WorkExperienceEntry } from "@/types";

type TextField = "fullName" | "phone" | "location" | "linkedinUrl" | "portfolioUrl" | "currentTitle";

const TEXT_FIELDS: { field: TextField; label: string }[] = [
  { field: "fullName", label: "Full Name" },
  { field: "phone", label: "Phone" },
  { field: "location", label: "Location" },
  { field: "linkedinUrl", label: "LinkedIn URL" },
  { field: "portfolioUrl", label: "Portfolio URL" },
  { field: "currentTitle", label: "Current Title" },
];

export type FieldConflict = {
  field: keyof ExtractedProfileFields;
  label: string;
  oldSummary: string;
  newSummary: string;
};

export type ExtractionDiffResult = {
  silentFills: Partial<Profile>;
  conflicts: FieldConflict[];
  conflictValues: Partial<ExtractedProfileFields>;
};

export function diffExtractedFields(current: Profile, extracted: ExtractedProfileFields): ExtractionDiffResult {
  const silentFills: Partial<Profile> = {};
  const conflicts: FieldConflict[] = [];
  const conflictValues: Partial<ExtractedProfileFields> = {};

  function fill<K extends keyof ExtractedProfileFields>(field: K, value: ExtractedProfileFields[K]) {
    // ExtractedProfileFields and Profile share every key used here with the same
    // runtime shape, but TS can't verify that generically through a keyof K index —
    // safe because every call site below passes a field/value pair drawn from the
    // same ExtractedProfileFields entry.
    (silentFills as Record<string, unknown>)[field] = value;
  }
  function flag<K extends keyof ExtractedProfileFields>(
    field: K,
    label: string,
    oldSummary: string,
    newSummary: string,
    value: ExtractedProfileFields[K],
  ) {
    conflicts.push({ field, label, oldSummary, newSummary });
    conflictValues[field] = value;
  }

  for (const { field, label } of TEXT_FIELDS) {
    const extractedValue = extracted[field].trim();
    if (!extractedValue) continue;
    const currentValue = current[field].trim();
    if (!currentValue) {
      fill(field, extractedValue);
    } else if (currentValue !== extractedValue) {
      flag(field, label, currentValue, extractedValue, extractedValue);
    }
  }

  // experienceLevel always holds a real enum value once a profile row exists
  // (mapProfileRowToUi defaults it to "junior") — there's no reliable way to tell
  // "never set" apart from "genuinely junior," so an extracted value always goes
  // through the review panel instead of silently filling.
  if (extracted.experienceLevel && extracted.experienceLevel !== current.experienceLevel) {
    flag(
      "experienceLevel",
      "Experience Level",
      experienceLevelLabel(current.experienceLevel),
      experienceLevelLabel(extracted.experienceLevel),
      extracted.experienceLevel,
    );
  }

  if (extracted.yearsExperience > 0) {
    if (current.yearsExperience === 0) {
      fill("yearsExperience", extracted.yearsExperience);
    } else if (current.yearsExperience !== extracted.yearsExperience) {
      flag(
        "yearsExperience",
        "Years of Experience",
        String(current.yearsExperience),
        String(extracted.yearsExperience),
        extracted.yearsExperience,
      );
    }
  }

  diffStringArrayField(current, extracted, "skills", "Skills", fill, flag);
  diffStringArrayField(current, extracted, "industries", "Industries", fill, flag);

  if (extracted.workExperience.length > 0) {
    if (current.workExperience.length === 0) {
      fill("workExperience", extracted.workExperience);
    } else if (!isSameWorkExperience(current.workExperience, extracted.workExperience)) {
      flag(
        "workExperience",
        "Work Experience",
        summarizeWorkExperience(current.workExperience),
        summarizeWorkExperience(extracted.workExperience),
        extracted.workExperience,
      );
    }
  }

  if (!isEducationEmpty(extracted.education)) {
    if (isEducationEmpty(current.education)) {
      fill("education", extracted.education);
    } else if (!isSameEducation(current.education, extracted.education)) {
      flag(
        "education",
        "Education",
        summarizeEducation(current.education),
        summarizeEducation(extracted.education),
        extracted.education,
      );
    }
  }

  return { silentFills, conflicts, conflictValues };
}

function diffStringArrayField(
  current: Profile,
  extracted: ExtractedProfileFields,
  field: "skills" | "industries",
  label: string,
  fill: <K extends keyof ExtractedProfileFields>(field: K, value: ExtractedProfileFields[K]) => void,
  flag: <K extends keyof ExtractedProfileFields>(
    field: K,
    label: string,
    oldSummary: string,
    newSummary: string,
    value: ExtractedProfileFields[K],
  ) => void,
) {
  const extractedValue = extracted[field];
  if (extractedValue.length === 0) return;
  const currentValue = current[field];
  if (currentValue.length === 0) {
    fill(field, extractedValue);
  } else if (!isSameStringSet(currentValue, extractedValue)) {
    flag(field, label, currentValue.join(", "), extractedValue.join(", "), extractedValue);
  }
}

function isSameStringSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function isSameWorkExperience(a: WorkExperienceEntry[], b: Omit<WorkExperienceEntry, "id">[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((entry, index) => {
    const other = b[index];
    return (
      entry.company === other.company &&
      entry.title === other.title &&
      entry.startDate === other.startDate &&
      entry.endDate === other.endDate &&
      entry.current === other.current &&
      entry.responsibilities === other.responsibilities
    );
  });
}

function summarizeWorkExperience(entries: (WorkExperienceEntry | Omit<WorkExperienceEntry, "id">)[]): string {
  if (entries.length === 0) return "None";
  const roles = entries.map((entry) => `${entry.company || "Unknown company"} (${entry.title || "Unknown title"})`);
  return `${entries.length} role${entries.length > 1 ? "s" : ""}: ${roles.join(", ")}`;
}

function isEducationEmpty(education: Education): boolean {
  return (
    !education.degree.trim() &&
    !education.fieldOfStudy.trim() &&
    !education.institution.trim() &&
    !education.graduationYear.trim()
  );
}

function isSameEducation(a: Education, b: Education): boolean {
  return (
    a.degree === b.degree &&
    a.fieldOfStudy === b.fieldOfStudy &&
    a.institution === b.institution &&
    a.graduationYear === b.graduationYear
  );
}

function summarizeEducation(education: Education): string {
  const parts = [education.degree, education.fieldOfStudy, education.institution, education.graduationYear].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(", ") : "None";
}
