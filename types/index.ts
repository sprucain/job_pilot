export type ExperienceLevel = "junior" | "mid" | "senior" | "lead";

export type WorkAuthorization = "citizen" | "permanent_resident" | "visa_required";

export type RemotePreference = "remote" | "onsite" | "hybrid" | "any";

export type CoverLetterTone = "formal" | "casual" | "enthusiastic";

export type WorkExperienceEntry = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string;
};

export type Education = {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
};

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  experienceLevel: ExperienceLevel;
  yearsExperience: number;
  skills: string[];
  industries: string[];
  workExperience: WorkExperienceEntry[];
  education: Education;
  jobTitlesSeeking: string;
  remotePreference: RemotePreference;
  preferredLocations: string;
  salaryExpectation: string;
  linkedinUrl: string;
  portfolioUrl: string;
  workAuthorization: WorkAuthorization;
  resumePdfUrl: string | null;
  isComplete: boolean;
};

// Fields Feature 07 (AI Profile Extraction) can derive from a resume. Missing
// keys always come back as their empty equivalent ("", [], 0, "" for the enum)
// rather than being omitted, so callers never need to distinguish "not present"
// from "not extracted" — see lib/resume-extraction.ts's lenient JSON parsing.
export type ExtractedProfileFields = {
  fullName: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  currentTitle: string;
  experienceLevel: ExperienceLevel | "";
  yearsExperience: number;
  skills: string[];
  industries: string[];
  workExperience: Omit<WorkExperienceEntry, "id">[];
  education: Education;
};
