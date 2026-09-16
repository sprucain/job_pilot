"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { deleteResume, saveProfile } from "@/actions/profile";
import type { ProfileInput } from "@/lib/profile-mapping";
import { CompletionIndicator } from "@/components/profile/CompletionIndicator";
import { EducationSection } from "@/components/profile/EducationSection";
import { ExtractionReviewPanel } from "@/components/profile/ExtractionReviewPanel";
import { JobPreferencesSection } from "@/components/profile/JobPreferencesSection";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { ProfessionalInfoSection } from "@/components/profile/ProfessionalInfoSection";
import { ResumeUpload } from "@/components/profile/ResumeUpload";
import { WorkExperienceSection } from "@/components/profile/WorkExperienceSection";
import { MAX_WORK_EXPERIENCE_ENTRIES } from "@/lib/constants";
import { diffExtractedFields, type FieldConflict } from "@/lib/extraction-review";
import { computeProfileCompletion } from "@/lib/profile-completion";
import type { ExtractedProfileFields, Profile, WorkExperienceEntry } from "@/types";

type Props = {
  initialProfile: Profile;
  initialResumePreviewUrl: string | null;
};

type SaveState = { status: "idle" | "success" | "error"; message?: string };

export function ProfileForm({ initialProfile, initialResumePreviewUrl }: Props) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(initialResumePreviewUrl);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [isDeletingResume, startDeleteTransition] = useTransition();
  const [isExtracting, startExtractTransition] = useTransition();
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isGenerating, startGenerateTransition] = useTransition();
  const [generateError, setGenerateError] = useState<string | null>(null);
  // True once the *active* resume file is the AI-generated one (set after a
  // successful Generate, cleared the moment the user picks their own file or
  // deletes it). Extracting from a resume GLM wrote from this same profile would
  // just re-extract its own output back into the form — see the Extract button's
  // disabled state below.
  const [isGeneratedResume, setIsGeneratedResume] = useState(false);
  const [conflicts, setConflicts] = useState<FieldConflict[]>([]);
  const [conflictValues, setConflictValues] = useState<Partial<ExtractedProfileFields>>({});

  // Save/Delete/Extract/Generate all write to the same resume file and/or the same
  // profile row — while any one is in flight, the others are disabled so their
  // requests can't interleave (e.g. Delete completing mid-Generate and having its
  // result silently resurrected by Generate's own upload landing after).
  const isBusy = isPending || isDeletingResume || isExtracting || isGenerating;

  // Extraction is a multi-second round trip — the user can keep editing the form
  // while it's in flight. handleExtract must diff against the profile as of when
  // the response actually lands, not the stale snapshot from when it was clicked,
  // or a field the user just typed into could get silently overwritten by the
  // "silent fill" path below. Synced via effect, not during render — writing to a
  // ref during render is disallowed (react-hooks/refs).
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

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

  function buildProfileFormData(): FormData {
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
    return formData;
  }

  // Shared by both Save Profile and Generate Resume — Generate always runs a save
  // first so the generated PDF reflects whatever's on screen, not stale DB state.
  // Deliberately does NOT touch saveState/generateError itself — those are owned by
  // whichever action actually invoked this, so a Generate-triggered save doesn't
  // show a stray "Profile saved." success banner underneath a Generate failure.
  async function persistProfileCore() {
    const result = await saveProfile(buildProfileFormData());
    if (result.success && result.data) {
      updateProfile({ resumePdfUrl: result.data.resumePdfUrl });
      setResumePreviewUrl(result.data.resumePreviewUrl);
      setResumeFile(null);
    }
    return result;
  }

  function handleSave() {
    setGenerateError(null);
    startTransition(async () => {
      const result = await persistProfileCore();
      if (result.success) {
        setSaveState({ status: "success", message: "Profile saved." });
      } else {
        setSaveState({ status: "error", message: result.error ?? "Something went wrong." });
      }
    });
  }

  function handleGenerate() {
    // Generate overwrites the single resumes/{user_id}/resume.pdf slot — including a
    // manually-uploaded original, which has no other copy anywhere. Delete already
    // confirms for the same reason; Generate needs the same guard.
    const hasExistingResume = Boolean(profile.resumePdfUrl || resumeFile);
    if (
      hasExistingResume &&
      !window.confirm("Generating a resume from your profile will replace your current resume file. Continue?")
    ) {
      return;
    }

    setGenerateError(null);
    startGenerateTransition(async () => {
      const saveResult = await persistProfileCore();
      if (!saveResult.success) {
        setGenerateError(saveResult.error ?? "Couldn't save your profile before generating. Please try again.");
        return;
      }

      try {
        const response = await fetch("/api/resume/generate", { method: "POST" });
        const result = await response.json();
        if (!result.success) {
          setGenerateError(result.error ?? "Resume generation failed. Please try again.");
          return;
        }
        updateProfile({ resumePdfUrl: result.data.resumePdfUrl });
        setResumePreviewUrl(result.data.resumePreviewUrl);
        setIsGeneratedResume(true);
      } catch (error) {
        console.error("[ProfileForm]", error);
        setGenerateError("Resume generation failed. Please try again.");
      }
    });
  }

  function handleResumeFileSelect(file: File) {
    setResumeFile(file);
    setIsGeneratedResume(false);
  }

  function handleExtract() {
    setExtractError(null);
    startExtractTransition(async () => {
      try {
        // Extraction reads whatever PDF is currently loaded — a just-picked file, or
        // the already-saved resume re-fetched from its signed preview URL — without
        // requiring a save first.
        const blob = resumeFile ?? (resumePreviewUrl ? await (await fetch(resumePreviewUrl)).blob() : null);
        if (!blob) {
          setExtractError("No resume available to extract from.");
          return;
        }

        const formData = new FormData();
        formData.set("resume", blob, "resume.pdf");

        const response = await fetch("/api/resume/extract", { method: "POST", body: formData });
        const result = await response.json();
        if (!result.success) {
          setExtractError(result.error ?? "Extraction failed. Please try again or fill in the form manually.");
          return;
        }

        // result.data is untyped JSON from `fetch(...).json()` — safe to assert here
        // because the route always runs it through lib/resume-extraction.ts's
        // normalizeExtractedFields, which guarantees the full ExtractedProfileFields shape.
        const extracted = result.data as ExtractedProfileFields;
        const { silentFills, conflicts: newConflicts, conflictValues: newConflictValues } = diffExtractedFields(
          profileRef.current,
          extracted,
        );
        if (Object.keys(silentFills).length > 0) updateProfile(silentFills);
        setConflicts(newConflicts);
        setConflictValues(newConflictValues);
      } catch (error) {
        console.error("[ProfileForm]", error);
        setExtractError("Extraction failed. Please try again or fill in the form manually.");
      }
    });
  }

  function handleApplyConflicts(accepted: Set<string>) {
    const patch: Partial<Profile> = {};
    for (const conflict of conflicts) {
      if (!accepted.has(conflict.field)) continue;
      const value = conflictValues[conflict.field];
      if (value === undefined) continue;
      if (conflict.field === "workExperience") {
        // conflictValues.workExperience is only ever set from ExtractedProfileFields's
        // own workExperience array (see lib/extraction-review.ts's flag() calls) — safe
        // to narrow away the `unknown` from Partial<ExtractedProfileFields> indexing.
        patch.workExperience = (value as Omit<WorkExperienceEntry, "id">[]).map((entry) => ({
          ...entry,
          id: crypto.randomUUID(),
        }));
      } else {
        // Same reasoning as lib/extraction-review.ts's fill() — Profile and
        // ExtractedProfileFields share this field's shape for every other conflict.field,
        // but TS can't verify that generically through a keyof-derived index.
        (patch as Record<string, unknown>)[conflict.field] = value;
      }
    }
    updateProfile(patch);
    setConflicts([]);
    setConflictValues({});
  }

  function handleDiscardConflicts() {
    setConflicts([]);
    setConflictValues({});
  }

  function handleDeleteResume() {
    if (!window.confirm("Remove your uploaded resume? This can't be undone.")) return;
    startDeleteTransition(async () => {
      const result = await deleteResume();
      if (result.success) {
        updateProfile({ resumePdfUrl: null });
        setResumePreviewUrl(null);
        setResumeFile(null);
        setIsGeneratedResume(false);
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
        onFileSelect={handleResumeFileSelect}
        onDelete={handleDeleteResume}
        isDeleting={isDeletingResume}
        onExtract={handleExtract}
        isExtracting={isExtracting}
        extractError={extractError}
        isGeneratedResume={isGeneratedResume}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        generateError={generateError}
        busy={isBusy}
      />

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <h2 className="text-base font-semibold text-text-primary">Profile Information</h2>
        <p className="mt-1 text-sm text-text-secondary">
          This context is used to accurately represent you in agent interactions.
        </p>

        {conflicts.length > 0 && (
          <div className="mt-6">
            <ExtractionReviewPanel
              conflicts={conflicts}
              onApply={handleApplyConflicts}
              onDiscard={handleDiscardConflicts}
            />
          </div>
        )}

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
          disabled={isBusy}
          className="mt-6 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
