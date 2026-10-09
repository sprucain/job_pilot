export type NormalizedJob = {
  title: string;
  company: string;
  location: string;
  salary: string | null;
  jobType: string;
  aboutRole: string;
  sourceUrl: string;
  externalApplyUrl: string;
};

export type JobScore = {
  matchScore: number;
  matchReason: string;
  matchedSkills: string[];
  missingSkills: string[];
};

export type ScoredJob = NormalizedJob & JobScore;
