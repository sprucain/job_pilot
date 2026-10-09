# Memory — JobPilot Build Progress

Last updated: 2026-10-09

## What was built

**Session 15 — Features 14, 15, 16: Dashboard (commit 601a340)**

- **14 Dashboard UI** — `app/dashboard/page.tsx` built to `context/designs/dashboard.png`. `components/dashboard/`: `StatsBar`, `StatCard`, `RecentActivity`, `ResearchActivityChart`, `JobsOverTimeChart`, `MatchDistributionChart` (recharts, client components), `IncompleteProfileBanner` (real: shown when `computeProfileCompletion()` has missing fields). `lib/chart-theme.ts` holds chart colours as CSS-variable references. `recharts` installed and added to `code-standards.md`'s approved list.
- **Navbar** (`components/layout/Navbar.tsx`): authenticated variant now has icons, right-aligned links and an accent underline on the active link. The logged-out homepage navbar is unchanged.
- **15 Stats real data** — `lib/dashboard-stats.ts`: `loadDashboardStats()` + pure `computeDashboardStats()`. Total jobs, avg match, researched count (`company_research IS NOT NULL`), jobs in the last 7 days. Trend badges are real (last 7 days vs the 7 before); with no earlier-week data the card shows an "All time" caption instead.
- **16 Recent activity real data** — `lib/recent-activity.ts`: `loadRecentActivity()` + pure `buildActivityEntries()`. Merges the latest 8 completed `agent_runs` ("Found X jobs for …", green dot) and 8 researched jobs ("Researched …", blue dot), keeps 8.
- **Schema change:** `jobs.researched_at timestamptz` (nullable) added. `app/api/agent/research/route.ts` sets it on every save; the one existing researched row was backfilled with its `found_at`. `architecture.md` updated.
- `/review` of 14-16 found 2 issues, both fixed: the three charts now carry a "Sample data" label and `role="img"`/`aria-label`.
- Docs updated: `progress-tracker.md` (14-16 done, next is 17), `ui-registry.md`, `architecture.md`, `code-standards.md`.

## Decisions made

- **The mockup wins over `build-plan.md` text:** the 4th stat card is "Jobs This Week" and the top-right chart is "Company Research Activity" (the plan's cover letters / resume tailoring are out of scope).
- "This week" is a rolling 7 days, not a calendar week.
- Research entries are dated by the new `researched_at`, not `found_at` (which is when the job was discovered). A re-run bumps it, so a job appears once, at its latest research.
- Only info-blue and success-green activity dots are used; the mockup's purple dot has no real event behind it.
- Charts are separate client components, so `architecture.md`'s single `AnalyticsCharts.tsx` was not created.
- Data loaders live in `lib/` (same as `lib/profile-server.ts`); components stay free of DB calls.

## Problems solved

- PostgREST caps responses at 1000 rows by default, so the average-match query pages through in chunks of 1000.
- Charts take colours as props, not classes: pass `var(--color-*)` strings (see `lib/chart-theme.ts`) to avoid hex literals.
- Don't `git stash` while `next dev` is running (carried over from Feature 13).

## Current state

- Features 01-16 complete; `tsc --noEmit` and `eslint .` clean. Branch main is committed locally and was pushed to origin at the end of this session.
- Verified: stat/activity calculations with sample data, both activity queries against the live DB, a visual match to the mockup (scratch route, 1440px), `/dashboard` redirects to `/login` when logged out.
- **Not verified:** a real authenticated `/dashboard` render (no OAuth session in the sandbox). Check the stat numbers, activity feed and banner in your own browser.
- The three charts still show **sample data** (labelled as such) until Feature 17.
- `npm audit` shows 10 vulnerabilities (1 critical in Next.js itself), unchanged.

## Next session starts with

Feature 17 — Analytics Charts, PostHog Data (`build-plan.md`): wire the three charts to PostHog events for the current user (job_found by day over 30 days; matchScore distribution in 50-60 … 90-100 buckets; company_researched by day over 7 days), with an empty state per chart. Then remove the "Sample data" labels and `lib/dashboard-mock.ts`. Run `/architect` first: it needs a server-side PostHog query path (personal API key / query API), and none is configured in `.env.local` or listed in `code-standards.md`'s env table.

## Open questions

- How to read PostHog data server-side for Feature 17: which API key and endpoint, and whether to query PostHog at all or compute from the DB (`jobs.found_at`, `jobs.researched_at`, `match_score`).
- Whether the mockup's navbar avatar icon should be added (carried over, still undecided).
- Optionally use the Browserbase session to fetch full job descriptions from the employer page (carried over).
- Long-standing: RLS cross-user isolation only structurally verified; no live authenticated session in this sandbox.
