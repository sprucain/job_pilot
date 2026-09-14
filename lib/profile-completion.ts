import type { Profile } from "@/types";

type RequiredField = {
  key: string;
  label: string;
  isFilled: (profile: Profile) => boolean;
};

const REQUIRED_FIELDS: RequiredField[] = [
  { key: "full_name", label: "Full Name", isFilled: (p) => p.fullName.trim().length > 0 },
  { key: "email", label: "Email", isFilled: (p) => p.email.trim().length > 0 },
  { key: "phone", label: "Phone", isFilled: (p) => p.phone.trim().length > 0 },
  { key: "location", label: "Location", isFilled: (p) => p.location.trim().length > 0 },
  { key: "current_title", label: "Job Title", isFilled: (p) => p.currentTitle.trim().length > 0 },
  {
    key: "experience_level",
    label: "Experience Level",
    isFilled: (p) => p.experienceLevel.trim().length > 0,
  },
  {
    key: "years_experience",
    label: "Years of Experience",
    isFilled: (p) => p.yearsExperience > 0,
  },
  { key: "skills", label: "Skills", isFilled: (p) => p.skills.length > 0 },
  {
    key: "work_experience",
    label: "Work Experience",
    isFilled: (p) => p.workExperience.length > 0,
  },
  {
    key: "education",
    label: "Education",
    isFilled: (p) =>
      p.education.degree.trim().length > 0 &&
      p.education.fieldOfStudy.trim().length > 0 &&
      p.education.institution.trim().length > 0 &&
      p.education.graduationYear.trim().length > 0,
  },
];

export type ProfileCompletion = {
  percentage: number;
  missingFields: { key: string; label: string }[];
};

export function computeProfileCompletion(profile: Profile): ProfileCompletion {
  const missingFields = REQUIRED_FIELDS.filter((field) => !field.isFilled(profile)).map(
    (field) => ({ key: field.key, label: field.label }),
  );

  const filledCount = REQUIRED_FIELDS.length - missingFields.length;
  const percentage = Math.round((filledCount / REQUIRED_FIELDS.length) * 100);

  return { percentage, missingFields };
}
