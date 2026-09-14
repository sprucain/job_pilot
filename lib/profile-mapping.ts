import type {
  Education,
  ExperienceLevel,
  Profile,
  RemotePreference,
  WorkAuthorization,
  WorkExperienceEntry,
} from "@/types";

export type WorkExperienceEntryDb = Omit<WorkExperienceEntry, "id">;

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  current_title: string | null;
  experience_level: string | null;
  years_experience: number | null;
  skills: string[];
  industries: string[];
  work_experience: WorkExperienceEntryDb[];
  education: Partial<Education>;
  job_titles_seeking: string[];
  remote_preference: string | null;
  preferred_locations: string[];
  salary_expectation: string | null;
  cover_letter_tone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  work_authorization: string | null;
  resume_pdf_url: string | null;
  is_complete: boolean;
};

export type ProfileInput = Omit<Profile, "id" | "email" | "resumePdfUrl" | "isComplete">;

const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = "junior";
const DEFAULT_REMOTE_PREFERENCE: RemotePreference = "any";
const DEFAULT_WORK_AUTHORIZATION: WorkAuthorization = "citizen";

export function mapProfileRowToUi(
  row: ProfileRow | null,
  user: { id: string; email: string },
): Profile {
  return {
    id: user.id,
    fullName: row?.full_name ?? "",
    email: user.email,
    phone: row?.phone ?? "",
    location: row?.location ?? "",
    currentTitle: row?.current_title ?? "",
    // DB column is untyped `text`, but only this module ever writes it, and only
    // with values from the ExperienceLevel union — safe to narrow without a runtime check.
    experienceLevel: (row?.experience_level as ExperienceLevel | null) ?? DEFAULT_EXPERIENCE_LEVEL,
    yearsExperience: row?.years_experience ?? 0,
    skills: row?.skills ?? [],
    industries: row?.industries ?? [],
    workExperience: (row?.work_experience ?? []).map((entry) => ({
      ...entry,
      id: crypto.randomUUID(),
    })),
    education: {
      degree: row?.education?.degree ?? "",
      fieldOfStudy: row?.education?.fieldOfStudy ?? "",
      institution: row?.education?.institution ?? "",
      graduationYear: row?.education?.graduationYear ?? "",
    },
    jobTitlesSeeking: (row?.job_titles_seeking ?? []).join(", "),
    // Same reasoning as experienceLevel above — narrowing an untyped DB column that
    // only this module ever writes, always from the RemotePreference union.
    remotePreference: (row?.remote_preference as RemotePreference | null) ?? DEFAULT_REMOTE_PREFERENCE,
    preferredLocations: (row?.preferred_locations ?? []).join(", "),
    salaryExpectation: row?.salary_expectation ?? "",
    linkedinUrl: row?.linkedin_url ?? "",
    portfolioUrl: row?.portfolio_url ?? "",
    // Same reasoning as experienceLevel above — narrowing an untyped DB column that
    // only this module ever writes, always from the WorkAuthorization union.
    workAuthorization: (row?.work_authorization as WorkAuthorization | null) ?? DEFAULT_WORK_AUTHORIZATION,
    resumePdfUrl: row?.resume_pdf_url ?? null,
    isComplete: row?.is_complete ?? false,
  };
}

function stripEntryId(entry: WorkExperienceEntry): WorkExperienceEntryDb {
  const { company, title, startDate, endDate, current, responsibilities } = entry;
  return { company, title, startDate, endDate, current, responsibilities };
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapProfileInputToDbPayload(
  input: ProfileInput,
): Omit<ProfileRow, "id" | "email" | "resume_pdf_url" | "is_complete" | "cover_letter_tone"> {
  return {
    full_name: input.fullName,
    phone: input.phone,
    location: input.location,
    current_title: input.currentTitle,
    experience_level: input.experienceLevel,
    years_experience: input.yearsExperience,
    skills: input.skills,
    industries: input.industries,
    work_experience: input.workExperience.map(stripEntryId),
    education: input.education,
    job_titles_seeking: splitCommaList(input.jobTitlesSeeking),
    remote_preference: input.remotePreference,
    preferred_locations: splitCommaList(input.preferredLocations),
    salary_expectation: input.salaryExpectation,
    linkedin_url: input.linkedinUrl,
    portfolio_url: input.portfolioUrl,
    work_authorization: input.workAuthorization,
  };
}
