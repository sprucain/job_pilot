import type { createInsforgeServer } from "@/lib/insforge-server";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

// Every resume — manually uploaded or AI-generated — lives at this single fixed key
// per architecture.md ("resumes/{user_id}/resume.pdf — Current active resume PDF").
// Centralized here since both actions/profile.ts and app/api/resume/generate/route.ts
// write to it.
export function getResumeStorageKey(userId: string): string {
  return `${userId}/resume.pdf`;
}

// Shared by the manual-upload path (actions/profile.ts) and the AI-generation path
// (app/api/resume/generate/route.ts) — both upload to the same key, so the call
// (and its 2-arg File|Blob signature — see library-docs.md's Storage correction)
// lives in one place instead of two independently drifting copies.
export function uploadResumeFile(insforge: InsforgeServer, userId: string, file: File | Blob) {
  return insforge.storage.from("resumes").upload(getResumeStorageKey(userId), file);
}

// Best-effort — a signing failure shouldn't fail a save/generate that already
// succeeded, callers just fall back to no inline preview until the next page load.
export async function signResumePreviewUrl(insforge: InsforgeServer, resumePdfUrl: string): Promise<string | null> {
  const { data, error } = await insforge.storage.from("resumes").createSignedUrl(resumePdfUrl);
  if (error) {
    console.error("[resume-storage]", error);
    return null;
  }
  return data?.signedUrl ?? null;
}
