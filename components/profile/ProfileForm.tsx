"use client";

import { useMemo, useState, useTransition } from "react";

import { deleteResume, saveProfile } from "@/actions/profile";
import type { ProfileInput } from "@/lib/profile-mapping";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { EducationSection } from "@/components/profile/EducationSection";
import { JobPreferencesSection } from "@/components/profile/JobPreferencesSection";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { ProfessionalInfoSection } from "@/components/profile/ProfessionalInfoSection";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { WorkExperienceSection } from "@/components/profile/WorkExperienceSection";
import { computeProfileCompletion } from "@/lib/profile-completion";
import type { Profile, WorkExperienceEntry } from "@/types";

type Props = {
  initialProfile: Profile;
  initialResumePreviewUrl: string | null;
};

type SaveState = { status: "idle" | "success" | "error"; message?: string };

const MAX_WORK_EXPERIENCE_ENTRIES = 3;

export function ProfileForm({ initialProfile, initialResumePreviewUrl }: Props) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(initialResumePreviewUrl);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [isDeletingResume, startDeleteTransition] = useTransition();

  const completion = useMemo(() => computeProfileCompletion(profile), [profile]);

  function updateProfile(patch: Partial<Profile>) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  function updateWorkExperienceEntry(id: string, patch: Partial<WorkExperienceEntry>) {
    setProfile((current) => ({
      ...current,
      workExperience: current.workExperience.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function addWorkExperienceEntry() {
    setProfile((current) => ({
      ...current,
      workExperience: [
        ...current.workExperience,
        {
          id: crypto.randomUUID(),
          company: "",
          title: "",
          startDate: "",
          endDate: "",
          current: false,
          responsibilities: "",
        },
      ],
    }));
  }

  function removeWorkExperienceEntry(id: string) {
    setProfile((current) => ({
      ...current,
      workExperience: current.workExperience.filter((entry) => entry.id !== id),
    }));
  }

  function handleSave() {
    startTransition(async () => {
      const profileInput: ProfileInput = {
        fullName: profile.fullName,
        phone: profile.phone,
        location: profile.location,
        currentTitle: profile.currentTitle,
        experienceLevel: profile.experienceLevel,
        yearsExperience: profile.yearsExperience,
        skills: profile.skills,
        industries: profile.industries,
        workExperience: profile.workExperience,
        education: profile.education,
        jobTitlesSeeking: profile.jobTitlesSeeking,
        remotePreference: profile.remotePreference,
        preferredLocations: profile.preferredLocations,
        salaryExpectation: profile.salaryExpectation,
        linkedinUrl: profile.linkedinUrl,
        portfolioUrl: profile.portfolioUrl,
        workAuthorization: profile.workAuthorization,
      };
      const formData = new FormData();
      formData.set("profile", JSON.stringify(profileInput));
      if (resumeFile) formData.set("resume", resumeFile);

      const result = await saveProfile(formData);
      if (result.success) {
        setSaveState({ status: "success", message: "Profile saved." });
        if (result.data) {
          updateProfile({ resumePdfUrl: result.data.resumePdfUrl });
          setResumePreviewUrl(result.data.resumePreviewUrl);
        }
        setResumeFile(null);
      } else {
        setSaveState({ status: "error", message: result.error ?? "Something went wrong." });
      }
    });
  }

  function handleDeleteResume() {
    if (!window.confirm("Remove your uploaded resume? This can't be undone.")) return;
    startDeleteTransition(async () => {
      const result = await deleteResume();
      if (result.success) {
        updateProfile({ resumePdfUrl: null });
        setResumePreviewUrl(null);
        setResumeFile(null);
        setSaveState({ status: "success", message: "Resume removed." });
      } else {
        setSaveState({ status: "error", message: result.error ?? "Failed to delete resume." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <CompletionIndicator
        percentage={completion.percentage}
        missingFields={completion.missingFields}
      />

      <ResumeUpload
        existingResumeUrl={profile.resumePdfUrl}
        previewUrl={resumePreviewUrl}
        pendingFile={resumeFile}
        onFileSelect={setResumeFile}
        onDelete={handleDeleteResume}
        isDeleting={isDeletingResume}
      />

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h2 className="text-base font-semibold text-text-primary">Profile Information</h2>
        <p className="mt-1 text-sm text-text-secondary">
          This context is used to accurately represent you in agent interactions.
        </p>

        <div className="mt-6 flex flex-col gap-6 divide-y divide-border [&>*:not(:first-child)]:pt-6">
          <PersonalInfoSection profile={profile} onChange={updateProfile} />
          <ProfessionalInfoSection profile={profile} onChange={updateProfile} />
          <WorkExperienceSection
            entries={profile.workExperience}
            onFieldChange={updateWorkExperienceEntry}
            onAdd={addWorkExperienceEntry}
            onRemove={removeWorkExperienceEntry}
            canAddMore={profile.workExperience.length < MAX_WORK_EXPERIENCE_ENTRIES}
          />
          <EducationSection profile={profile} onChange={updateProfile} />
          <JobPreferencesSection profile={profile} onChange={updateProfile} />
        </div>

        {saveState.status === "success" && (
          <p className="mt-4 text-sm text-success">{saveState.message}</p>
        )}
        {saveState.status === "error" && (
          <p className="mt-4 text-sm text-error">{saveState.message}</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="mt-6 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
