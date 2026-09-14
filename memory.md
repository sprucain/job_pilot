# Memory — JobPilot Build Progress

Last updated: 2026-09-10

## What was built

**Session 6 — /review of Feature 06 + dev-server fix**
No new features. Ran `/review` against Feature 06 (Profile Save Logic) and resolved the two issues it surfaced:
- `lib/profile-mapping.ts` — added justifying comments to the three previously-uncommented `as ExperienceLevel|RemotePreference|WorkAuthorization` type assertions on `mapProfileRowToUi`'s DB-read path (`code-standards.md` requires assertions be commented; the `<select>` onChange casts elsewhere already followed this, these three didn't).
- `actions/profile.ts` — closed a TOCTOU race in `saveProfile`'s insert-vs-update logic: if the first-time INSERT fails, it now re-queries for the row and falls back to UPDATE instead of erroring outright, covering the case where two tabs both save a brand-new profile at once. No SDK-level upsert exists to do this atomically (checked `@insforge/sdk` types directly — no `upsert()`/`onConflict`).
Both changes verified via `tsc --noEmit` and `eslint` (clean).

## Decisions made

- No new architectural decisions this session — this was a review-and-fix pass, not new feature work.

## Problems solved

- **Sandbox dev-server block from last session was a false alarm — real cause was a stale lock file.** `next dev` was failing with "another next dev is already running" and the browser showed a blank page. Root cause: `.next/dev/lock` held a PID (271917) from a session that no longer exists (the environment now has a new `.devcontainer/`, suggesting a container rebuild killed the old process without Next.js cleaning up its lock). Fix: delete `.next/dev/lock`, restart `next dev`. Confirmed working via curl — `/` returns 200 with real SSR'd HTML, `/profile` correctly redirects unauthenticated requests to `/login` (also 200, real content, not blank). **The prior "sandbox network block" theory from Session 5 was wrong** — it was this stale lock the whole time. Dev server access is not actually restricted in this environment.
- Confirmed via the review: Feature 06's `remote_preference` dropdown does include an "Any" option (`JobPreferencesSection.tsx`) matching the DB default — an initial grep search seemed to suggest it was missing, but reading the file directly showed it wasn't. Worth remembering: grep-based greps for enum coverage in this codebase can false-negative on short common words like "any" — read the file directly rather than trusting a keyword grep for that kind of check.

## Current state

- Features 01–06 complete and now reviewed. `tsc --noEmit`/`eslint .` clean across the whole project.
- Dev server works normally in this sandbox — no longer a blocker. It was left running in the background at the end of this session on `http://localhost:3000`.
- Feature 06 has still never been verified through an actual authenticated browser session (real login → fill form → Save → reload → confirm pre-fill). This is now purely a "hasn't happened yet" gap, not an environment limitation — nothing is blocking it anymore.
- No sign-out UI still exists anywhere (carried over gap from Feature 02/03 — `posthog.reset()` on logout still not wired up).

## Next session starts with

Feature 07 — AI Profile Extraction from Resume, per `context/build-plan.md`. Before starting:
- If `next dev` ever again claims "already running" with a blank page, check `.next/dev/lock` for a stale PID first — that was the actual cause here, not a sandbox restriction. Just delete the lock file and restart.
- Consider doing (or asking the developer to do) one real manual pass through Feature 06's Save flow now that the dev server is confirmed working, before building on top of it.

## Open questions

- Sign-out UI still doesn't exist anywhere — needed before `posthog.reset()` can be wired up on logout. Still no feature in build-plan.md explicitly specs one; worth raising before Phase 5 (Dashboard) if it keeps getting deferred.
- RLS cross-user isolation (Feature 04) is still only structurally verified, not empirically tested.
- `library-docs.md` has accumulated several corrections across sessions (storage `upload()`'s real signature, no options object; private-bucket signed-URL constraint; no SDK-level upsert for database writes) — worth a full skim before trusting any other not-yet-implemented section at face value.
