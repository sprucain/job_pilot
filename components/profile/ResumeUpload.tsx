"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, FileText, Trash2, UploadCloud } from "lucide-react";

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

type Props = {
  existingResumeUrl: string | null;
  previewUrl: string | null;
  pendingFile: File | null;
  onFileSelect: (file: File) => void;
  onDelete: () => void;
  isDeleting: boolean;
};

export function ResumeUpload({
  existingResumeUrl,
  previewUrl,
  pendingFile,
  onFileSelect,
  onDelete,
  isDeleting,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The just-selected file isn't uploaded yet, so preview it locally via an
  // object URL rather than waiting for a save + a fresh signed URL round trip.
  const pendingPreviewUrl = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : null),
    [pendingFile],
  );
  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Resume must be a PDF file.");
      return;
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      setError("Resume must be under 5MB.");
      return;
    }

    setError(null);
    onFileSelect(file);
  }

  const hasResume = Boolean(pendingFile || existingResumeUrl);
  const activePreviewUrl = pendingFile ? pendingPreviewUrl : previewUrl;
  // Every resume is uploaded to the same fixed key (userId/resume.pdf) — this
  // isn't a guess, it's the literal filename actions/profile.ts uploads under.
  const fileName = pendingFile?.name ?? (existingResumeUrl ? "resume.pdf" : null);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <h2 className="text-base font-semibold text-text-primary">Resume</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Upload an existing resume to auto-fill the profile, or generate a new tailored one from
        your details below.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {hasResume ? (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-secondary px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface">
                <FileText className="h-4 w-4 text-accent" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{fileName}</p>
                <p className="text-xs text-text-muted">{pendingFile ? "Not yet saved" : "Uploaded"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activePreviewUrl && (
                <a
                  href={activePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent"
                >
                  <Eye className="h-4 w-4" aria-hidden />
                  View
                </a>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-sm font-medium text-text-secondary hover:text-accent"
              >
                Replace
              </button>
              {existingResumeUrl && !pendingFile && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isDeleting}
                  aria-label="Remove resume"
                  className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {isDeleting ? "Removing..." : "Remove"}
                </button>
              )}
            </div>
          </div>

          {activePreviewUrl ? (
            <iframe
              src={activePreviewUrl}
              title="Resume preview"
              className="mt-4 h-[480px] w-full rounded-md border border-border"
            />
          ) : (
            <p className="mt-4 text-sm text-text-secondary">Preview unavailable right now.</p>
          )}

          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`mt-6 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed px-6 py-10 text-center ${
            isDragging ? "border-accent bg-accent-muted" : "border-border-muted bg-surface-secondary"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface">
            <UploadCloud className="h-5 w-5 text-accent" aria-hidden />
          </div>
          <p className="mt-4 text-sm font-semibold text-text-primary">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-sm text-text-secondary">PDF formatting only. Maximum file size 5MB.</p>
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              inputRef.current?.click();
            }}
            className="mt-4 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] hover:bg-surface-secondary"
          >
            Select Resume
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
        <p className="text-sm text-text-secondary">Need a fresh document based on the fields below?</p>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-dark"
        >
          <FileText className="h-4 w-4" aria-hidden />
          Generate Resume from Profile
        </button>
      </div>
    </div>
  );
}
