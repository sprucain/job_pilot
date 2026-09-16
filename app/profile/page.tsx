import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createInsforgeServer } from "@/lib/insforge-server";
import { getCurrentUserProfile } from "@/lib/profile-server";
import { signResumePreviewUrl } from "@/lib/resume-storage";

export default async function ProfilePage() {
  const insforge = await createInsforgeServer();
  const { user, profile } = await getCurrentUserProfile(insforge);
  if (!user) redirect("/login");

  // Best-effort — a signing failure just means no inline preview on first load,
  // not a broken page (same reasoning as the post-save signing in actions/profile.ts).
  const resumePreviewUrl = profile.resumePdfUrl
    ? await signResumePreviewUrl(insforge, profile.resumePdfUrl)
    : null;

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
