import { PDFParse } from "pdf-parse";

import { MAX_WORK_EXPERIENCE_ENTRIES } from "@/lib/constants";
import { asNumber, asString, asStringArray } from "@/lib/json-normalize";
import { callVeniceJson } from "@/lib/venice-json";
import type { Education, ExperienceLevel, ExtractedProfileFields, WorkExperienceEntry } from "@/types";

const MIN_EXTRACTED_TEXT_LENGTH = 50;
const UNREADABLE_PDF_ERROR = "Could not extract text from this PDF. Please try a different file.";
const EXTRACTION_FAILED_ERROR = "Extraction failed. Please try again or fill in the form manually.";

const SYSTEM_PROMPT = `You are a resume parsing assistant. Extract structured profile data from the resume text and return only valid JSON matching this schema:

{
  "fullName": string,
  "phone": string,
  "location": string,
  "linkedinUrl": string,
  "portfolioUrl": string,
  "currentTitle": string,
  "experienceLevel": "junior" | "mid" | "senior" | "lead",
  "yearsExperience": number,
  "skills": string[],
  "industries": string[],
  "workExperience": [{ "company": string, "title": string, "startDate": string, "endDate": string, "current": boolean, "responsibilities": string }],
  "education": { "degree": string, "fieldOfStudy": string, "institution": string, "graduationYear": string }
}

Only include the most recent ${MAX_WORK_EXPERIENCE_ENTRIES} roles in workExperience. Use "" for a missing string, [] for a missing list, and 0 for a missing number. Never invent information that isn't in the resume text.`;

type ExtractionResult =
  | { success: true; data: ExtractedProfileFields }
  | { success: false; error: string };

export async function extractProfileFromResume(buffer: Buffer): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: buffer });
  let extractedText: string;
  try {
    const result = await parser.getText();
    extractedText = result.text;
  } catch (error) {
    console.error("[resume-extraction]", error);
    return { success: false, error: UNREADABLE_PDF_ERROR };
  } finally {
    await parser.destroy();
  }

  if (extractedText.trim().length < MIN_EXTRACTED_TEXT_LENGTH) {
    return { success: false, error: UNREADABLE_PDF_ERROR };
  }

  const result = await callVeniceJson({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: extractedText,
    temperature: 0.3,
    maxTokens: 800,
  });
  if (!result.success) {
    return { success: false, error: EXTRACTION_FAILED_ERROR };
  }

  return { success: true, data: normalizeExtractedFields(result.data) };
}

// GLM 5.2's JSON output is trusted for shape but not for every key being present —
// missing or malformed fields default to their empty equivalent instead of failing
// the whole extraction over one flaky field.
function normalizeExtractedFields(parsed: Record<string, unknown>): ExtractedProfileFields {
  return {
    fullName: asString(parsed.fullName),
    phone: asString(parsed.phone),
    location: asString(parsed.location),
    linkedinUrl: asString(parsed.linkedinUrl),
    portfolioUrl: asString(parsed.portfolioUrl),
    currentTitle: asString(parsed.currentTitle),
    experienceLevel: asExperienceLevel(parsed.experienceLevel),
    yearsExperience: asNumber(parsed.yearsExperience),
    skills: asStringArray(parsed.skills),
    industries: asStringArray(parsed.industries),
    workExperience: asWorkExperienceArray(parsed.workExperience),
    education: asEducation(parsed.education),
  };
}

function asExperienceLevel(value: unknown): ExperienceLevel | "" {
  return value === "junior" || value === "mid" || value === "senior" || value === "lead" ? value : "";
}

function asWorkExperienceArray(value: unknown): Omit<WorkExperienceEntry, "id">[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_WORK_EXPERIENCE_ENTRIES).map((entry) => {
    // entry is `unknown` (from Array.isArray narrowing an `unknown` value) — safe to
    // read as a plain record because every field access below goes through asString,
    // which itself narrows unknown -> string with a runtime typeof check.
    const record = (entry ?? {}) as Record<string, unknown>;
    return {
      company: asString(record.company),
      title: asString(record.title),
      startDate: asString(record.startDate),
      endDate: asString(record.endDate),
      current: typeof record.current === "boolean" ? record.current : false,
      responsibilities: asString(record.responsibilities),
    };
  });
}

function asEducation(value: unknown): Education {
  // Same reasoning as asWorkExperienceArray above — value is `unknown` (from
  // Record<string, unknown> indexing), and every field read below goes through
  // asString's own runtime typeof check.
  const record = (value ?? {}) as Record<string, unknown>;
  return {
    degree: asString(record.degree),
    fieldOfStudy: asString(record.fieldOfStudy),
    institution: asString(record.institution),
    graduationYear: asString(record.graduationYear),
  };
}
