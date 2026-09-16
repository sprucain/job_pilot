import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { RESUME_GENERATION_FAILED_ERROR } from "@/lib/constants";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getCurrentUserProfile } from "@/lib/profile-server";
import { generateResumeContent } from "@/lib/resume-generation";
import { renderResumePdf } from "@/lib/resume-pdf";
import { signResumePreviewUrl, uploadResumeFile } from "@/lib/resume-storage";
import type { Profile } from "@/types";

const MISSING_NAME_ERROR = "Add your name before generating a resume.";
const MISSING_EXPERIENCE_ERROR = "Add at least one work experience entry (with a title or company) before generating a resume.";

export async function POST() {
  try {
    const insforge = await createInsforgeServer();
    const { user, profile } = await getCurrentUserProfile(insforge);
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    if (!profile.fullName.trim()) {
      return NextResponse.json({ success: false, error: MISSING_NAME_ERROR }, { status: 422 });
    }

    // Fully-blank entries (e.g. "Add role" clicked then generated without filling
    // anything in) are dropped before generation — they'd otherwise produce garbage
    // like "at  (Invalid Date - )" in both the AI prompt and the rendered PDF. Both
    // the validity gate below and the content actually sent to Venice/the PDF use
    // this same filtered list so they can't disagree with each other.
    const meaningfulWorkExperience = profile.workExperience.filter(
      (entry) => entry.title.trim() || entry.company.trim(),
    );
    if (meaningfulWorkExperience.length === 0) {
      return NextResponse.json({ success: false, error: MISSING_EXPERIENCE_ERROR }, { status: 422 });
    }
    const resumeProfile: Profile = { ...profile, workExperience: meaningfulWorkExperience };

    const generationResult = await generateResumeContent(resumeProfile);
    if (!generationResult.success) {
      return NextResponse.json({ success: false, error: generationResult.error }, { status: 500 });
    }

    const buffer = await renderResumePdf(resumeProfile, generationResult.data);
    // storage.upload only accepts File | Blob (2-arg — no options object). A raw
    // Buffer isn't a valid BlobPart under this project's strict TS config — wrap it
    // in a Blob first. See library-docs.md's Storage section.
    const pdfBlob = new Blob([new Uint8Array(buffer)], { type: "application/pdf" });

    const { data: uploadData, error: uploadError } = await uploadResumeFile(insforge, user.id, pdfBlob);
    if (uploadError || !uploadData) {
      console.error("[resume/generate]", uploadError);
      return NextResponse.json({ success: false, error: RESUME_GENERATION_FAILED_ERROR }, { status: 500 });
    }

    // resumes is a private bucket — the persisted reference is the storage key, not a
    // fetchable link, same as the manual upload path in actions/profile.ts.
    const resumePdfUrl = uploadData.key;

    // The DB update and the signed-preview-URL mint are independent (both only need
    // the key from the upload above) — run them concurrently instead of sequentially.
    const [{ error: updateError }, resumePreviewUrl] = await Promise.all([
      insforge.database.from("profiles").update({ resume_pdf_url: resumePdfUrl }).eq("id", user.id),
      signResumePreviewUrl(insforge, resumePdfUrl),
    ]);
    if (updateError) {
      console.error("[resume/generate]", updateError);
      return NextResponse.json({ success: false, error: RESUME_GENERATION_FAILED_ERROR }, { status: 500 });
    }

    revalidatePath("/profile");

    return NextResponse.json({ success: true, data: { resumePdfUrl, resumePreviewUrl } });
  } catch (error) {
    console.error("[resume/generate]", error);
    return NextResponse.json({ success: false, error: RESUME_GENERATION_FAILED_ERROR }, { status: 500 });
  }
}
