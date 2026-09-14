import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createInsforgeServer } from "@/lib/insforge-server";
import { mapProfileRowToUi, type ProfileRow } from "@/lib/profile-mapping";

export default async function ProfilePage() {
  const insforge = await createInsforgeServer();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data.user) redirect("/login");

  const { data: row, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle<ProfileRow>();
  if (error) console.error("[app/profile]", error);

  const profile = mapProfileRowToUi(row ?? null, { id: data.user.id, email: data.user.email ?? "" });

  // Best-effort — a signing failure just means no inline preview on first load,
  // not a broken page (same reasoning as the post-save signing in actions/profile.ts).
  let resumePreviewUrl: string | null = null;
  if (profile.resumePdfUrl) {
    const { data: signedData, error: signError } = await insforge.storage
      .from("resumes")
      .createSignedUrl(profile.resumePdfUrl);
    if (signError) console.error("[app/profile]", signError);
    else resumePreviewUrl = signedData?.signedUrl ?? null;
  }

  return (
    <>
      <Navbar isAuthenticated activeRoute="/profile" />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-[1440px] px-8 py-8">
          <ProfileForm initialProfile={profile} initialResumePreviewUrl={resumePreviewUrl} />
        </div>
      </main>
      <Footer />
    </>
  );
}
