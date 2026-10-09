# Memory — JobPilot Build Progress

Last updated: 2026-10-09

## What was built

**Session 13 — Features 11 and 12, general review, pushed to GitHub (commit a0aeed6 on origin/main, includes Feature 10)**

- **Feature 11 (Filter + Sort + Pagination):** URL-driven state (`?q=&match=high|low&sort=newest|oldest&page=N`, defaults omitted). New `lib/job-query.ts` (`parseJobQuery`, `buildSearchFilter`, `buildJobsHref`, `JOBS_PAGE_SIZE = 20`). `app/find-jobs/page.tsx` does all filtering/sorting/paging server-side. `JobFilters.tsx` is a client component (300ms debounced search via `router.replace`, selects via `router.push`, any change resets to page 1, mirrors URL `q` back into the input on back/forward). `JobsPagination.tsx` is `<Link>`-based, takes a `query` prop, not a client component.
- **Feature 12 (Job Details):** `app/find-jobs/[id]/page.tsx` (+ `not-found.tsx`, `error.tsx`) per `context/designs/job-details.png`. Components in `components/job-details/`: `JobInfo`, `MatchScore`, `JobDescription`, `CompanyResearch` (empty state), `JobActions`. New `JobDetail` type and `mapJobRowToDetail()`/`JOB_DETAIL_COLUMNS` in `lib/job-mapping.ts`. Find Jobs table company/role cells now link to `/find-jobs/{id}`. Content width `max-w-[844px]`.
- Two `/review` passes plus a general review: all findings fixed. `ui-registry.md` and `progress-tracker.md` updated; tracker shows Feature 12 done, Feature 13 next.

## Decisions made

- **20 rows per page** (build-plan spec) over the mockup's 6 — developer-confirmed.
- **Filter/sort/page state lives in the URL**, server component queries; no new API route.
- **Out-of-range `?page=`:** PostgREST answers 416 with no count (verified live), so `page.tsx` re-queries page 1 for the total, then jumps to the true last page. Page capped at 100,000; `_` escaped in search; search input stripped of PostgREST filter syntax chars.
- **Match badge is always green** on the details page (mockup shows a single 85% sample).
- **Research Company button is intentionally `disabled`** ("Coming soon") with the active accent look until Feature 13.
- **Navbar avatar icon from the job-details mockup was NOT added** — no other page has it and no destination is specified.
- Job URLs are only linked if http(s) (they come from a third-party API).

## Problems solved

- **Truncated job descriptions are an Adzuna limit, not a bug:** the search API hard-caps `description` at 500 chars ending in `…`, and Adzuna's listing pages return 403 to automated fetches (don't circumvent). `JobDescription` shows the whole stored text plus a "preview" note and a "Read the full description" link to the original posting when it ends in `…`/`...`.
- PostgREST `or(company.ilike.*x*,title.ilike.*x*)` syntax and the escaped-underscore form were confirmed accepted via a live request.

## Current state

- Features 01–12 complete and pushed. `tsc --noEmit` / `eslint .` clean. Only `memory.md` is uncommitted.
- Verified visually via a scratch route + Playwright vs. the mockup (zero console errors) and unauthenticated gating (307 on `/find-jobs/{id}`). No real authenticated click-through of Features 10–12 has been done (sandbox has no OAuth session) — developer should try filters/search/out-of-range page/job details in their own browser.
- "Low Match" filter will usually be empty since only scores >= 70 are persisted.

## Next session starts with

Feature 13 — Company Research Agent (`build-plan.md`): `POST /api/agent/research` with Browserbase + Stagehand + Venice synthesis, saving the dossier to `jobs.company_research` and enabling the Research Company button / rendering the dossier in `CompanyResearch.tsx`. Run `/architect` first. First verify Stagehand + Venice compatibility (long-standing open question) and check whether `@browserbasehq/stagehand` and `lib/browserbase.ts`/`lib/stagehand.ts` need installing/creating, and that Browserbase env vars exist (don't record their values).

## Open questions

- Stagehand + Venice compatibility still unverified (blocks Feature 13 design).
- Optionally use Feature 13's Browserbase session to fetch full job descriptions from the employer page (beyond Adzuna's 500-char preview) — developer to decide.
- Whether to add the mockup's navbar avatar icon.
- Long-standing: RLS cross-user isolation only structurally verified; no live-authenticated-session verification possible in this sandbox.
