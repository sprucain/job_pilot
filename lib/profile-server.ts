import type { createInsforgeServer } from "@/lib/insforge-server";
import { mapProfileRowToUi, type ProfileRow } from "@/lib/profile-mapping";
import type { Profile } from "@/types";

type InsforgeServer = Awaited<ReturnType<typeof createInsforgeServer>>;

export type CurrentUserProfileResult =
  | { user: { id: string; email: string }; profile: Profile }
  | { user: null; profile: null };

// Shared by every server-side entry point that needs "who's logged in + their
// profile row" — app/profile/page.tsx and app/api/resume/generate/route.ts both had
// this exact auth + fetch + map sequence copy-pasted before. actions/profile.ts's
// saveProfile deliberately does NOT use this — it only ever needs 2 narrow columns
// (resume_pdf_url, is_complete) to decide insert-vs-update, not the full mapped Profile.
export async function getCurrentUserProfile(insforge: InsforgeServer): Promise<CurrentUserProfileResult> {
  const { data: userData } = await insforge.auth.getCurrentUser();
  const user = userData.user;
  if (!user) return { user: null, profile: null };

  const { data: row, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();
  if (error) console.error("[profile-server]", error);

  const normalizedUser = { id: user.id, email: user.email ?? "" };
  return { user: normalizedUser, profile: mapProfileRowToUi(row ?? null, normalizedUser) };
}
