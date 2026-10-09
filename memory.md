# Memory — JobPilot Build Progress

Last updated: 2026-10-09

## What was built

**Session 14 — Feature 13, Company Research Agent (commit 985760c on local main; not yet pushed to origin)**

- `POST /api/agent/research` (`app/api/agent/research/route.ts`, `maxDuration = 120`): auth, load the user's job + profile, resolve company homepage, one Browserbase/Stagehand V4 session, Venice GLM 5.2 synthesis, save to `jobs.company_research`, `company_researched` PostHog event, per-user in-flight lock (409).
- `lib/stagehand-model.ts`: Venice `generate` adapter for Stagehand (strict `json_schema` chat completions). `lib/company-url.ts`: homepage resolution. `agent/researcher.ts`: the browser session. `agent/research-synthesis.ts`: the 9-field dossier.
- `CompanyDossier` type, `normalizeCompanyDossier()` and `company_research` in `lib/job-mapping.ts`. `components/job-details/CompanyResearch.tsx` is now a client component: Research/Re-run button, loading and error states, all 9 fields. `logAgentError` accepts a null `runId`.
- `@browserbasehq/stagehand` installed and added to `serverExternalPackages` in `next.config.ts`. Docs updated: `library-docs.md` (V3 to V4 rewrite), `architecture.md`, `code-standards.md`, `build-plan.md`, `progress-tracker.md` (Feature 13 done, next is 14), `ui-registry.md`.
- A `/review` found 8 issues; all resolved.

## Decisions made

- **Stagehand + Venice question is answered:** V4 has no base-URL option, so custom providers go through `model: { generate }`. Our adapter works, verified live.
- **Route is synchronous.** Stagehand's `extract()` runs in our process (the old "session runs independently" note was wrong). Browser deadline is 75s and a live run takes about 60s.
- **Homepage discovery uses Browserbase Search**, accepting only a non-aggregator result whose domain matches the company name (e.g. Block, Inc. → block.xyz), then a `www.{slug}.com` guess. Adzuna's tracking links 403 automated requests, so the redirect can't be read. We never circumvent this, and the server never fetches employer URLs.
- **If GLM synthesis fails twice, the route returns an error and saves nothing.** This is a deliberate exception to "always return a dossier", because a placeholder would look like real research and inflate "Companies Researched". Recorded in `build-plan.md`.
- `sources` is only the pages the browser actually visited, never model-supplied. Scraped text goes to the LLM in delimited "untrusted data" blocks and the dossier renders as plain text.
- The in-flight lock is in-memory per server instance (best-effort, accepted).

## Problems solved

- Turbopack can't bundle Stagehand (`new URL("../", import.meta.url)`), so it needs `serverExternalPackages`. **Don't `git stash` while `next dev` is running:** it briefly reverted `next.config.ts` and the dev server kept that state until the config was touched.
- The installed Browserbase SDK names the session length option `api_timeout` (min 60s), not `timeout` as the docs page says. No project ID is needed anywhere.
- Stagehand bundles its own zod 4.4.3, so types clash with ours. `extractTyped()` casts the schema in and re-validates with our zod.
- The model rarely returns `pageLinks`, so sub-pages are also picked from DOM anchors by keyword.
- A dead domain can load as Chrome's error page and the model will "extract" it. `gotoUsable()` requires a real HTTP response under 400.
- Synthesis at 800 and 1500 `max_tokens` truncated the dossier, so it is now 2500 with a cap of 5 items per list.

## Current state

- Features 01-13 complete; `tsc --noEmit` and `eslint .` clean. Commit 985760c is local only (a0aeed6 was the last pushed commit).
- Verified live: the full pipeline on real DB jobs (Lendbuzz 3 sub-pages, TalentOla 1), Stripe, and the dead-domain path; the card renders in both states with no console errors; the unauthenticated route returns 401.
- **Not verified:** a real authenticated click-through. The sandbox has no OAuth session, so the route's DB save and PostHog event were checked only by reading the code. The DB has 27 jobs, so you can test in your own browser.
- `npm audit` shows 10 vulnerabilities (1 critical in Next.js itself), identical before and after the Stagehand install.
- Browserbase Search has a limited free-plan allowance (one call per research click); failure falls back to the slug guess.

## Next session starts with

1. Optionally try Research Company on a job at `/find-jobs/{id}` in your own browser (dossier appears, survives refresh, `company_researched` shows in PostHog), then push to origin if you want it there.
2. Feature 14 — Dashboard Page, Full UI (`build-plan.md`): four stat cards, recent activity, three recharts charts with mock data, incomplete-profile banner. Run `/architect` first and read the design mockup in `context/designs/` if one exists.

## Open questions

- Whether to push 985760c to GitHub.
- Whether the mockup's navbar avatar icon should be added (carried over, still undecided).
- Optionally use the Browserbase session to fetch full job descriptions from the employer page, beyond Adzuna's 500-char preview (carried over).
- Long-standing: RLS cross-user isolation only structurally verified; no live authenticated session in this sandbox.
