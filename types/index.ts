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

// Matches architecture.md's `jobs.source` CHECK constraint exactly — never any
// other value.
export type JobSource = "search" | "url";

// Only the fields the Find Jobs table (Feature 09) renders — company, role,
// match score, salary, source, and a display-ready "date found" string. This is
// mock data for now; Feature 10 (Adzuna Job Discovery) will introduce the full
// `jobs` table shape (about_role, requirements, company_research, etc. per
// architecture.md) once the job details/research pages that need those fields
// are actually built.
export type Job = {
  id: string;
  company: string;
  title: string;
  matchScore: number;
  salary: string;
  source: JobSource;
  foundAt: string;
};

// Everything the Job Details page (Feature 12) renders. Separate from `Job` (the Find Jobs
// table row) so the table keeps loading only the 6 columns it shows — descriptions and
// skill arrays are fetched only for the single job being viewed.
export type JobDetail = {
  id: string;
  company: string;
  title: string;
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
  salary: string;
  location: string;
  jobType: string;
  foundAt: string;
  description: string;
  jobPostUrl: string | null;
  applyUrl: string | null;
  companyResearch: CompanyDossier | null;
};

// The 9-field dossier GLM 5.2 synthesises for Feature 13 (Company Research Agent) and the
// shape stored in `jobs.company_research` (jsonb). `sources` is the list of pages the browser
// actually visited — never model-supplied.
export type CompanyDossier = {
  companyOverview: string;
  techStack: string[];
  culture: string[];
  whyThisRole: string;
  yourEdge: string[];
  gapsToAddress: string[];
  smartQuestions: string[];
  interviewPrep: string[];
  sources: string[];
};
