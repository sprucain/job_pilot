# Memory — JobPilot Build Progress

Last updated: 2026-09-16

## What was built

**Session 10 — Feature 08 (Resume PDF Generation from Profile): architected, implemented, code-reviewed, all findings fixed, and shipped**

- Ran `/architect` to lock four decisions before building: (1) auto-save-then-generate — clicking Generate always runs the same save path as Save Profile first, so the PDF reflects what's on screen, not stale DB state; (2) a hard minimum before generating (non-empty `fullName` + at least one work-experience entry with a non-blank title/company); (3) content split — GLM only writes the summary paragraph + polishes each role's `responsibilities` into bullets, company/title/dates/education/skills render straight from the DB, never round-tripped through the model; (4) a fixed single-page PDF layout built from scratch (no mockup exists for the generated PDF itself).
- Implemented: `lib/resume-generation.ts` (Venice call), `lib/resume-pdf.tsx` (`@react-pdf/renderer` template), `app/api/resume/generate/route.ts`, wired the previously-stub "Generate Resume from Profile" button in `ResumeUpload.tsx`/`ProfileForm.tsx`.
- Installed `@react-pdf/renderer@4.9.0` (approved but never actually installed, same situation `pdf-parse` was in before Feature 07) — its documented API matched the installed version exactly this time, and no `serverExternalPackages` entry was needed (verified live, no Turbopack bundling issue). Separately discovered the installed `@insforge/sdk`'s `storage.upload()` is actually `(path, File | Blob)` only — no options object, no `contentType`/`upsert` flags — `library-docs.md`'s Storage section was wrong and got corrected.
- Ran a full multi-angle `/code-review` (8 finder agents) + manual `/review` in parallel, then fixed every finding:
  - **Critical**: Generate silently overwrote a user's manually-uploaded original resume with zero confirmation (same storage slot as Delete, which does confirm) — added `window.confirm()`.
  - **Important**: Generate-triggered auto-save was writing to the same `saveState` the Save button's banner reads, causing a contradictory "Profile saved." + red generate-error to show together on every real generate failure — split `persistProfile` into a state-free core.
  - **Important**: no cross-locking between Save/Delete/Extract/Generate (4 independent `useTransition`s) allowed concrete races, e.g. Delete finishing mid-Generate and being silently resurrected by Generate's own upload — added one shared `isBusy` flag gating all four.
  - **Important**: missing `revalidatePath("/profile")` in the generate route (every other mutation has it) — added.
  - **Important**: blank work-experience entries passed the minimum-content gate and would leak garbage into the Venice prompt/PDF — route now filters to non-blank entries before both the gate and generation.
  - **Important**: Extract-after-Generate feedback loop (extracting from the AI's own just-generated PDF) — added an `isGeneratedResume` flag that disables Extract until the user uploads their own file again.
  - **Important**: GLM's bullets were zipped onto `profile.workExperience` by array index with no verification — added a title/company echo-back + match check, with a naive-sentence-split fallback on mismatch.
  - **Important**: duplication cluster (profile-fetch logic ×3, upload/sign sequence, Venice call-and-parse scaffold, JSON coercion helpers) — extracted `lib/profile-server.ts`, `lib/resume-storage.ts`, `lib/venice-json.ts` (also now distinguishes a `finish_reason: "length"` truncation from a real parse failure), `lib/json-normalize.ts`; migrated Feature 07's `lib/resume-extraction.ts` onto the shared ones too.
  - **Important**: `ui-tokens.md`'s "never hardcode hex" invariant had no exception for non-DOM renderers (react-pdf can't consume CSS variables at all) — added an explicit documented carve-out, same category as the existing border-radius exception, and swapped `resume-pdf.tsx`'s inline hex for named constants mirroring real tokens.
  - **Minor**: sequential DB-update + sign-URL calls in the route parallelized via `Promise.all`.
- Re-verified everything live afterward, not just `tsc`/`eslint`: the generation pipeline (including a deliberately-blank role fed directly to the normalizer to confirm graceful fallback), the refactored extraction pipeline (to confirm the shared-helper migration didn't regress Feature 07), and the new `busy`/`isGeneratedResume` UI gating via a Playwright scratch harness.
- `progress-tracker.md`/`ui-registry.md` updated throughout, including a full writeup of the review-fix pass.

## Decisions made

- **Feature 08 scope/shape** — see the four `/architect` decisions above; all locked in and reflected in the shipped code.
- **Single resume storage slot is intentional** (`resumes/{user_id}/resume.pdf`, per `architecture.md`) — both manual upload and AI-generation write to the same key. This is correct per spec, but it's why Generate needed its own confirm dialog once the overwrite risk was surfaced.
- **`lib/resume-storage.ts` shares the upload+sign steps but NOT the DB update** between `actions/profile.ts` and the generate route — they have genuinely different update semantics (whole-profile update vs. single-field update), not worth forcing into one function.
- **Shared Venice/JSON helpers return typed failure reasons, never hardcoded error strings** — each caller (`resume-extraction.ts`/`resume-generation.ts`) keeps its own user-facing copy. Keeps the "please try again" wording feature-specific while still sharing the actual scaffold.

## Problems solved

- `@insforge/sdk`'s real `storage.upload()` signature (`(path, File | Blob)`, no options object) didn't match `library-docs.md`'s documented `(path, buffer, {contentType, upsert})` example — corrected. A generated `Buffer` also isn't a valid `BlobPart` under this project's strict TS config; wrap in `new Blob([new Uint8Array(buffer)])` first.
- Contradictory success/error banner bug (see Important findings above) — root cause was one shared `saveState` used by two different actions; fixed by giving each its own state ownership.
- Positional-mismatch risk in AI-generated bullets — fixed with an echo-back verification + fallback, not just trusting prompt instructions.
- Everything else listed under "Important"/"Critical" above.

## Current state

- Feature 08 (Resume PDF Generation from Profile) is fully complete: implemented, multi-angle reviewed, all findings fixed, re-verified live, committed and pushed (see next steps below — commit was requested this session, confirm it landed).
- `progress-tracker.md` shows Feature 08 as last completed, Feature 09 (Find Jobs Page — Full UI) next, entering Phase 3.
- `tsc --noEmit`/`eslint .` clean. No known open bugs.

## Next session starts with

Feature 09 — Find Jobs Page — Full UI (`build-plan.md`'s first item under Phase 3, mockup at `context/designs/find-jobs.png`). This is a UI-only phase (no logic yet, per the project's "mock data first" build principle) — search controls card, jobs table with match-score bars, filter bar, pagination. No `/architect` blocker expected here (mirrors Feature 05's pattern), but check `ui-rules.md`/`ui-tokens.md` for match-score color-band rules before building the table.

## Open questions

- None specific to Feature 08 remain.
- Long-standing, unchanged: RLS cross-user isolation (Feature 04) still only structurally verified, not empirically tested — sandbox limitation (`run-raw-sql` always executes as `postgres`, bypasses RLS).
- Stagehand + Venice compatibility still unverified — relevant only once Feature 13 (Company Research Agent) is built.
- The concurrent-click races fixed this session (Delete-during-Generate, Save-during-Generate) were fixed structurally (shared `isBusy` lock) but never reproduced against a live authenticated session — no OAuth session obtainable in this sandbox, same limitation as every prior DB-writing feature.
