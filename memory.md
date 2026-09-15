# Memory — JobPilot Build Progress

Last updated: 2026-09-14

## What was built

**Session 8 — Venice AI (GLM 5.2) provider swap + Feature 07 architecture session (in progress, not yet implemented)**

- Ran `/remember restore` to pick up Session 7 state, confirmed accurate.
- Started `/architect` for Feature 07 (AI Profile Extraction from Resume). Read `build-plan.md`, `architecture.md`, `code-standards.md`, `library-docs.md`, and existing profile code (`ResumeUpload.tsx`, `ProfileForm.tsx`, `actions/profile.ts`, `types/index.ts`) before discussing anything.
- Mid-session, developer asked to swap the project's AI provider from OpenAI GPT-4o to Venice AI (GLM 5.2 model, OpenAI-compatible API) — confirmed as a full project-wide swap, docs included, not scoped to just Feature 07.
- Venice AI is now live and verified:
  - `.env.local` — added `VENICE_API_KEY` (kept the project's existing `.env.local` file rather than creating a separate `.env`, since it's already the single source of truth and equally gitignored).
  - `lib/venice-client.ts` (new) — singleton `getVeniceClient()` + `AI_MODEL = "zai-org-glm-5-2"` constant, same pattern as `lib/posthog-server.ts`'s singleton.
  - Installed the `openai` npm package (was on the approved list but not yet installed — this is the first feature to actually need it).
  - Ran a real `/chat/completions` test call against Venice from a scratch script — confirmed working end to end, then deleted the script.
- Docs updated project-wide to reflect the swap: `context/library-docs.md` (full "OpenAI GPT-4o" section rewritten to "Venice AI (GLM 5.2)", including the Company Research code sample), `context/code-standards.md` (env var table, approved dependencies list), `context/architecture.md` (stack table, lib/ folder sketch, Stagehand code sample), `context/project-overview.md` + `context/build-plan.md` (all prose "GPT-4o" mentions replaced).
- Feature 07 itself is still in the architecture-discussion phase — no Feature 07 code written yet (no route handler, no extraction module, no UI changes to `ResumeUpload.tsx`/`ProfileForm.tsx` beyond what already existed from Session 7).

## Decisions made

- **Full project-wide Venice swap, not feature-scoped** — developer explicitly confirmed this after being asked, rather than defaulting to "just wire it into Feature 07 and leave the rest on GPT-4o."
- **GLM 5.2 is a reasoning model — always pass `venice_parameters: { disable_thinking: true }` on every call.** Discovered by live testing during setup: without it, the model returns a separate `reasoning_content` field and spends completion tokens on invisible chain-of-thought before writing `content` — at low `max_tokens` (tested at 10) the reasoning consumed the entire budget and `content` came back as an empty string, which would silently break every `JSON.parse()` call site in this project. With the flag set, `reasoning_content` comes back `null` and `content` reliably holds the full response within the project's existing max-token budgets (300/800/1000/800 for matching/research/generation/extraction). This is now a hard documented rule in `library-docs.md`, not just a one-off fix.
- **Model string is always the `AI_MODEL` constant from `lib/venice-client.ts`** (currently `zai-org-glm-5-2`) — never hardcoded at a call site, replacing the old "always `'gpt-4o'`" rule.
- **Stagehand's own model config was deliberately NOT swapped to Venice** — flagged inline in both `library-docs.md` and `architecture.md` rather than guessed at. Stagehand takes a named-provider `modelName` string + apiKey, not an arbitrary OpenAI-compatible base URL, and whether it supports Venice at all is unverified. Feature 13 (Company Research Agent) isn't built yet — confirm Stagehand/Venice compatibility before building it, don't assume the raw-SDK swap pattern applies there too.
- **Feature 07 extraction pulls PDF bytes from whatever's currently loaded client-side** (a just-picked `pendingFile`, or a blob re-fetched from the signed preview URL if only an already-saved resume exists) — sent fresh as multipart `FormData` to the extraction endpoint. No DB write is required before extracting; this keeps it symmetric with Feature 06's "one combined Save Profile action" philosophy. Confirmed with developer.
- **Feature 07 extraction only auto-fills resume-derivable fields**: `fullName`, `phone`, `location`, `linkedinUrl`, `portfolioUrl`, `currentTitle`, `experienceLevel`, `yearsExperience`, `skills`, `industries`, `workExperience` (capped at 3, matching the form's existing cap), `education`. Explicitly left untouched: `jobTitlesSeeking`, `remotePreference`, `preferredLocations`, `salaryExpectation`, `workAuthorization` — these are search preferences a resume can't inform. Confirmed with developer.
- **Proposed but NOT yet confirmed when the session ended**: extraction logic should not live in `agent/` — `architecture.md`'s `agent/extractor.ts` was described for "job description extraction," which nothing in the build plan actually uses (that file has never been built and its description doesn't match this use case). Proposal instead: a plain `lib/resume-extraction.ts` (pdf-parse + GLM call) invoked from `app/api/resume/extract/route.ts`, following the route handler's own `{ success, data?, error? }` contract — no `agent_logs` entries, since this is a synchronous, single-shot, user-clicked action with no `run_id`/`job_id` to attach a log to, unlike the background-style operations `agent/` is designed for (Adzuna discovery, company research). **The developer had not yet answered this when `/remember save` was run — resolve it first thing next session.**

## Problems solved

- The reasoning-model / `disable_thinking` discovery above is the only "problem" this session — captured under Decisions made since it's load-bearing for every future AI call in this project, not a one-off fix.

## Current state

- Venice AI integration is live, tested, and documented — safe to build on immediately in any future feature.
- Feature 07 (AI Profile Extraction from Resume) is still in the `/architect` planning phase — no implementation files exist yet. Three of the architecture decisions are locked (PDF source, field scope, project-wide Venice swap); one (`agent/` vs `lib/resume-extraction.ts` + whether to log to `agent_logs`) was posed to the developer but the session ended before they answered it.
- `progress-tracker.md` still correctly shows Feature 06 as last completed / Feature 07 next — untouched this session since Feature 07 hasn't started building yet.
- `tsc --noEmit` / `eslint` clean after this session's changes (the new `lib/venice-client.ts` file).

## Next session starts with

Resume the `/architect` session for Feature 07 exactly where it left off: get the developer's answer on the `agent/` vs `lib/resume-extraction.ts` + `agent_logs` question, then cover the one remaining decision that hasn't been raised yet (overwrite behavior — does extraction fully overwrite fields that already have user-entered data, or only fill empty ones?), reach "Blueprint ready," get explicit plan confirmation, and only then implement:

- `lib/resume-extraction.ts` (pdf-parse + GLM extraction call) or `agent/extractor.ts`, per whichever way the open question resolves
- `app/api/resume/extract/route.ts`
- "Extract from Resume" button + loading state wired into `ResumeUpload.tsx`/`ProfileForm.tsx`
- Update `progress-tracker.md` and `ui-registry.md` per AGENTS.md's standing rule once Feature 07 actually ships

## Open questions

- The `agent/` vs `lib/` + `agent_logs` question above — still open, first thing to resolve next session.
- Overwrite behavior when a field already has user-entered data — not yet raised with the developer, needs surfacing before the Feature 07 blueprint is finished.
- Long-standing, unchanged: RLS cross-user isolation (Feature 04) is still only structurally verified, not empirically tested. `library-docs.md` has accumulated several corrections across sessions (this session's Venice/GPT-4o swap is the latest) — worth a full skim before trusting any other not-yet-implemented section at face value.
