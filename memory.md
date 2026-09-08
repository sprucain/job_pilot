# Memory — JobPilot Build Progress

Last updated: 2026-09-08

## What was built

**Session 3 — Feature 04: Database Schema (InsForge)**
Created via InsForge MCP `run-raw-sql`/`create-bucket` — no app code touched. Includes `/review` fixes applied in the same session:
- `profiles`, `agent_runs`, `jobs`, `agent_logs` tables, exact columns per `context/architecture.md`
- RLS enabled + 3 policies each (select/insert/update only — DELETE deliberately not granted on any table; nothing in build-plan.md deletes rows, and job-dismiss/profile-deletion are explicitly out of scope per project-overview.md), scoped to `auth.uid()` (`id` for profiles, `user_id` for the other three)
- FKs: `profiles.id → auth.users(id)` cascade; `agent_runs/jobs/agent_logs.user_id → profiles(id)` cascade; `jobs.run_id`/`agent_logs.job_id` nullable, `ON DELETE SET NULL`
- `CHECK` constraints on all three documented enum columns: `jobs.source` (`search`/`url`), `agent_logs.level` (`info`/`success`/`warning`/`error`), `agent_runs.status` (`running`/`completed`/`failed` — added during `/review` fix, was initially missed while the other two were done)
- Indexes on every FK plus `jobs.match_score`/`jobs.found_at` (needed by upcoming Feature 11 sort/filter)
- `profiles_set_updated_at` trigger auto-maintains `updated_at`
- `resumes` storage bucket created with `isPublic: false`
- `context/build-plan.md` corrected in two places: struck a stale "tailored fields" bullet from Feature 04 (contradicted architecture.md and project-overview.md's "Resume tailoring per job" out-of-scope entry), and fixed Feature 16's text which referenced a nonexistent `agent_runs.created_at` column — now says `started_at` (agent_runs) / `found_at` (jobs)

**Session 1 — Feature 01: Homepage**
Complete homepage matching `context/designs/landing-page.png`: `app/page.tsx`, `components/layout/Navbar.tsx`/`Footer.tsx`, `components/homepage/Hero.tsx`/`Features.tsx`/`Testimonial.tsx`/`CTASection.tsx`/`CTAButtons.tsx`, plus `.bg-hero-glow` gradient utility in `app/globals.css`.

**Session 2 — Feature 02: Auth (InsForge Google + GitHub OAuth)**
- `lib/insforge-client.ts`, `lib/insforge-server.ts` — SSR client factories via `@insforge/sdk/ssr`
- `lib/auth-constants.ts` — shared cookie name constants
- `actions/auth.ts` — `signInWithGoogle`, `signInWithGithub`, `signOut` Server Actions
- `app/(auth)/login/page.tsx` — login card (no design mockup existed; built from existing tokens)
- `app/(auth)/callback/route.ts` — OAuth code exchange (Route Handler, not a page)
- `proxy.ts` (project root) — protects `/dashboard`, `/profile`, `/find-jobs`
- `.env.local` — real InsForge URL/anon key
- Follow-up: homepage CTA branching (`/login` vs `/dashboard`) and an authenticated Navbar variant (`isAuthenticated`/`activeRoute` props, no CTA button when logged in)

**Session 2 — Feature 03: PostHog Initialization**
Mostly pre-existing on disk when this session started (a PostHog setup wizard had run concurrently, outside this session, using an equivalent integration skill) — verified and completed rather than rebuilt:
- `instrumentation-client.ts` (project root) — client-side PostHog init
- `lib/posthog-server.ts` — server-side singleton `getPostHogClient()` + `flushPostHogSafely()` helper
- `next.config.ts` — `/ingest/*` reverse-proxy rewrites to PostHog's EU hosts
- Server-side events wired into the auth flow: `login_initiated`, `login_failed`, `login_completed` (added to `code-standards.md`'s approved event list)

## Decisions made

- **InsForge Postgres is Supabase-shaped:** confirmed via `run-raw-sql` before writing schema DDL — `auth.users(id uuid, ...)`, helper functions `auth.uid()`/`auth.email()`/`auth.role()`/`auth.jwt()`, and `anon`/`authenticated` roles already have default-privilege grants on new `public` tables. So RLS policies (not table GRANTs) are what actually restrict per-row access — used `auth.uid()` in every policy.
- **Storage bucket "own files only" is NOT enforced by Postgres RLS** — `storage.objects` has no `owner`/`user_id` column, only `uploaded_by text`/`bucket`/`key`. Per-user path isolation for `resumes/{user_id}/resume.pdf` relies on the InsForge SDK/API checking the caller against the path, not a DB-level guarantee. Important for Feature 06 (the actual upload logic) to not assume otherwise.
- **The InsForge admin SQL tool (`run-raw-sql`) always runs as `postgres` and blocks role/session-config changes** — `SET ROLE` and `set_config()` both error ("...is not allowed"), and `postgres` has `rolbypassrls = true`. This means RLS policies can be verified structurally through this tool (via `get-table-schema`/`pg_policies`/`pg_constraint`) but cross-user row isolation can never be empirically proven from here — there's no way to simulate a second authenticated user's session through this tool. Keep this in mind for any future schema/RLS work, not just Feature 04.
- **InsForge SSR pattern:** `@insforge/ssr` is not a real package — SSR helpers are subpath exports of `@insforge/sdk` (`@insforge/sdk/ssr`, `@insforge/sdk/ssr/middleware`). Confirmed by downloading the actual package.
- **Next.js 16 renamed `middleware.ts` → `proxy.ts`** (function name `proxy`, not `middleware`) — confirmed in `node_modules/next/dist/docs`. This project uses `proxy.ts`.
- **OAuth in SSR mode does not auto-exchange in the browser** — the flow is Server Action (`signInWithOAuth` with `skipBrowserRedirect: true`, stash `codeVerifier` in an httpOnly cookie) → provider → Route Handler callback (`exchangeOAuthCode`). The callback is a Route Handler, not a page.
- **`instrumentation-client.ts` is the correct PostHog client-init pattern** for this Next.js version (15.3+), not a `lib/posthog-client.ts` manually imported into `app/layout.tsx` — never combine with a `PostHogProvider`.
- Homepage/Navbar auth-state wiring was deliberately deferred out of Feature 02 itself and done as an immediate small follow-up instead of folding it in silently.
- Env var is `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, not `NEXT_PUBLIC_POSTHOG_KEY` as originally documented.

## Problems solved

- **`agent_runs.status` was missing its `CHECK` constraint** — `/review` caught that `jobs.source` and `agent_logs.level` (the same category of documented enum column) both got one but `agent_runs.status` didn't, purely an inconsistency in how the schema was written. Fixed by adding `agent_runs_status_check CHECK (status IN ('running','completed','failed'))`.
- **RLS policies granted more than any feature needs** — all four tables initially got full CRUD policies including DELETE, but no build-plan feature ever deletes a row (job-dismiss and profile-deletion are both explicitly out of scope). `/review` flagged it as unrequested scope; dropped all four DELETE policies so RLS denies deletes by default until a real feature justifies adding one back.
- **PostHog analytics could break the app it was instrumenting** — none of the `await posthog.flush()` calls were wrapped in try/catch, and `flush()` is documented to throw on network/HTTP errors; a PostHog outage could have crashed a login attempt (including a successful one never reaching `/dashboard`). Fixed with a shared `flushPostHogSafely()` helper — every flush call now routes through it.
- **PostHog login funnel couldn't be correlated per-person** — `login_initiated` used a discarded random UUID while `login_failed`/`login_completed`'s anonymous branch used the literal string `"anonymous"` for every anonymous visitor. Fixed by persisting the per-attempt UUID in a short-lived cookie and reusing it across the funnel, plus `posthog.alias()` linking it to the real `user.id` on success.
- Same class of bug existed in the InsForge auth code itself (missing try/catch in `proxy.ts`/`actions/auth.ts`/`callback/route.ts`, raw `error.message` leaking into redirect URLs) — fixed via `/review` → `/code-review` cycle before PostHog work started.
- A false-alarm "bug" (missing "Start for free" button + 404 on `/dashboard`) turned out to be correct behavior for an authenticated session hitting a not-yet-built route — confirmed via `/recover`, not a real issue.

## Current state

- Feature 04 (Database Schema) is complete and `/review`-clean (all findings from the review resolved — see Problems solved). Live in InsForge: 4 tables, 12 RLS policies (3 per table), 3 CHECK constraints, 7 indexes, 1 trigger, 1 private storage bucket. `tsc --noEmit` still clean (no app code changed this feature — pure infra via MCP tools).
- **Unresolved, carried forward:** RLS's actual cross-user row isolation is verified only structurally, not empirically (see Decisions — sandbox can't simulate a second user's session through `run-raw-sql`). Confirm for real once two real users have data, or via two real JWTs against the REST API.
- Feature 01 (Homepage), Feature 02 (Auth + follow-up), and Feature 03 (PostHog) are all code-complete, reviewed via `/review`, and had their findings fixed.
- `tsc --noEmit` and `eslint .` pass clean across the whole project.
- Verified live via Playwright: homepage and login page render with zero console errors; full OAuth click-through reaches Google's real sign-in screen with cookies set correctly; `proxy.ts` correctly redirects unauthenticated visitors off `/dashboard`, `/profile`, `/find-jobs`; PostHog's `/ingest/*` requests reach its EU servers through the proxy rewrites.
- Cannot verify the final OAuth leg (a completed real login) or PostHog events actually landing in the dashboard from this sandbox — no live provider credentials or PostHog MCP/dashboard access here. The developer separately confirmed a real Google login works correctly in their own browser.
- Known gap: `posthog.reset()` on logout isn't wired up — it's browser-only and there's still no sign-out UI anywhere in the app.
- `/dashboard`, `/profile`, `/find-jobs` pages don't exist yet (Phase 2/3/5) — `proxy.ts` protects those prefixes regardless, ready for when they're built.

## Next session starts with

Feature 05 (Profile Page — Full UI) per `context/build-plan.md` — build the complete profile page UI with mock data, no save logic yet: needs-attention banner, resume upload area, and the full Profile Information form (Personal/Professional/Work Experience/Education/Job Preferences sections). No design mockup is known to exist for this page yet (same situation as the login page in Feature 02) — check `context/designs/` first.

## Open questions

- Sign-out UI doesn't exist anywhere yet — needs a home (likely the Profile page or a Navbar user menu) before `posthog.reset()`-on-logout can be wired up. Feature 05's Profile page is a natural place to add it.
- `docs.md` files (`architecture.md`, `build-plan.md`, `library-docs.md`) have accumulated several corrections across sessions for stale patterns that didn't match the actual installed package versions or actual schema (`@insforge/sdk/ssr` not `@insforge/ssr`, `proxy.ts` not `middleware.ts`, `instrumentation-client.ts` not `lib/posthog-client.ts`, and this session's two build-plan.md schema-reference fixes) — worth a skim before trusting any *other* not-yet-implemented section of those docs at face value.
- `resumes` bucket's "own files only" access rule has no DB-level enforcement (see Decisions) — worth double-checking the InsForge SDK's actual behavior empirically once Feature 06 does a real upload, rather than assuming the path-prefix convention is enough.
- RLS cross-user isolation is unverified empirically (see Current state) — worth a real check once Feature 06+ produces actual multi-field profile/job data for the one real user account, or when a second real account exists.
