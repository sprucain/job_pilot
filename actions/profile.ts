"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createInsforgeServer } from "@/lib/insforge-server";
import {
  mapProfileInputToDbPayload,
  type ProfileInput,
  type ProfileRow,
} from "@/lib/profile-mapping";
import { computeProfileCompletion } from "@/lib/profile-completion";
import { flushPostHogSafely, getPostHogClient } from "@/lib/posthog-server";
import type { Profile } from "@/types";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

const workExperienceEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  responsibilities: z.string(),
});

const educationSchema = z.object({
  degree: z.string(),
  fieldOfStudy: z.string(),
  institution: z.string(),
  graduationYear: z.string(),
});

const profileInputSchema = z.object({
  fullName: z.string().max(200),
  phone: z.string().max(50),
  location: z.string().max(200),
  currentTitle: z.string().max(200),
  experienceLevel: z.enum(["junior", "mid", "senior", "lead"]),
  yearsExperience: z.number().int().min(0).max(80),
  skills: z.array(z.string().max(100)).max(50),
  industries: z.array(z.string().max(100)).max(50),
  workExperience: z.array(workExperienceEntrySchema).max(3),
  education: educationSchema,
  jobTitlesSeeking: z.string().max(500),
  remotePreference: z.enum(["remote", "onsite", "hybrid", "any"]),
  preferredLocations: z.string().max(500),
  salaryExpectation: z.string().max(100),
  linkedinUrl: z.string().max(300),
  portfolioUrl: z.string().max(300),
  workAuthorization: z.enum(["citizen", "permanent_resident", "visa_required"]),
}) satisfies z.ZodType<ProfileInput>;

type SaveProfileResult = {
  success: boolean;
  error?: string;
  data?: { resumePdfUrl: string | null; resumePreviewUrl: string | null };
};

type DeleteResumeResult = {
  success: boolean;
  error?: string;
};

export async function saveProfile(formData: FormData): Promise<SaveProfileResult> {
  try {
    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData.user;
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const rawProfile = formData.get("profile");
    if (typeof rawProfile !== "string") {
      return { success: false, error: "Invalid profile data" };
    }

    let parsedInput: unknown;
    try {
      parsedInput = JSON.parse(rawProfile);
    } catch {
      return { success: false, error: "Invalid profile data" };
    }

    const parseResult = profileInputSchema.safeParse(parsedInput);
    if (!parseResult.success) {
      console.error("[actions/profile]", parseResult.error);
      return { success: false, error: "Invalid profile data" };
    }

    const resumeEntry = formData.get("resume");
    const resumeFile = resumeEntry instanceof File && resumeEntry.size > 0 ? resumeEntry : null;
    if (resumeFile) {
      if (resumeFile.type !== "application/pdf") {
        return { success: false, error: "Resume must be a PDF file." };
      }
      if (resumeFile.size > MAX_RESUME_SIZE_BYTES) {
        return { success: false, error: "Resume must be under 5MB." };
      }
    }

    const { data: existing, error: fetchError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_url, is_complete")
      .eq("id", user.id)
      .maybeSingle<Pick<ProfileRow, "resume_pdf_url" | "is_complete">>();
    if (fetchError) {
      console.error("[actions/profile]", fetchError);
      return { success: false, error: "Failed to save profile" };
    }
    const wasComplete = existing?.is_complete ?? false;

    let resumePdfUrl = existing?.resume_pdf_url ?? null;
    if (resumeFile) {
      const { data: uploadData, error: uploadError } = await insforge.storage
        .from("resumes")
        .upload(`${user.id}/resume.pdf`, resumeFile);
      if (uploadError || !uploadData) {
        console.error("[actions/profile]", uploadError);
        return { success: false, error: "Failed to upload resume." };
      }
      // resumes is a private bucket — the SDK's signed URLs expire (max 7 days),
      // so the persisted reference is the storage key, not a fetchable link.
      resumePdfUrl = uploadData.key;
    }

    const completionInput: Profile = {
      ...parseResult.data,
      id: user.id,
      email: user.email ?? "",
      resumePdfUrl,
      isComplete: false,
    };
    const { missingFields } = computeProfileCompletion(completionInput);
    const isComplete = missingFields.length === 0;

    const dbPayload = {
      ...mapProfileInputToDbPayload(parseResult.data),
      email: user.email ?? null,
      resume_pdf_url: resumePdfUrl,
      is_complete: isComplete,
    };

    if (existing) {
      const { error: updateError } = await insforge.database
        .from("profiles")
        .update(dbPayload)
        .eq("id", user.id);
      if (updateError) {
        console.error("[actions/profile]", updateError);
        return { success: false, error: "Failed to save profile" };
      }
    } else {
      const { error: insertError } = await insforge.database
        .from("profiles")
        .insert([{ id: user.id, ...dbPayload }]);
      if (insertError) {
        // Another request may have inserted the row between the SELECT above and this
        // INSERT (e.g. two tabs saving a brand-new profile at once) — fall back to an
        // update rather than failing outright.
        const { data: raceCheck } = await insforge.database
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle<Pick<ProfileRow, "id">>();
        if (!raceCheck) {
          console.error("[actions/profile]", insertError);
          return { success: false, error: "Failed to save profile" };
        }
        const { error: retryUpdateError } = await insforge.database
          .from("profiles")
          .update(dbPayload)
          .eq("id", user.id);
        if (retryUpdateError) {
          console.error("[actions/profile]", retryUpdateError);
          return { success: false, error: "Failed to save profile" };
        }
      }
    }

    revalidatePath("/profile");

    if (isComplete && !wasComplete) {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: user.id,
        event: "profile_completed",
        properties: { userId: user.id },
      });
      await flushPostHogSafely(posthog);
    }

    // Best-effort — a signing failure shouldn't fail a save that already succeeded,
    // the UI just falls back to no inline preview until the next page load.
    let resumePreviewUrl: string | null = null;
    if (resumePdfUrl) {
      const { data: signedData, error: signError } = await insforge.storage
        .from("resumes")
        .createSignedUrl(resumePdfUrl);
      if (signError) {
        console.error("[actions/profile]", signError);
      } else {
        resumePreviewUrl = signedData?.signedUrl ?? null;
      }
    }

    return { success: true, data: { resumePdfUrl, resumePreviewUrl } };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to save profile" };
  }
}

export async function deleteResume(): Promise<DeleteResumeResult> {
  try {
    const insforge = await createInsforgeServer();
    const { data: userData } = await insforge.auth.getCurrentUser();
    const user = userData.user;
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: existing, error: fetchError } = await insforge.database
      .from("profiles")
      .select("resume_pdf_url")
      .eq("id", user.id)
      .maybeSingle<Pick<ProfileRow, "resume_pdf_url">>();
    if (fetchError) {
      console.error("[actions/profile]", fetchError);
      return { success: false, error: "Failed to delete resume" };
    }
    if (!existing?.resume_pdf_url) {
      return { success: true };
    }

    const { error: removeError } = await insforge.storage
      .from("resumes")
      .remove(existing.resume_pdf_url);
    if (removeError) {
      console.error("[actions/profile]", removeError);
      return { success: false, error: "Failed to delete resume" };
    }

    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: null })
      .eq("id", user.id);
    if (updateError) {
      console.error("[actions/profile]", updateError);
      return { success: false, error: "Failed to delete resume" };
    }

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("[actions/profile]", error);
    return { success: false, error: "Failed to delete resume" };
  }
}
