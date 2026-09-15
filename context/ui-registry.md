# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Navbar

File: components/layout/Navbar.tsx
Last updated: 2026-09-14

| Property         | Class                                                 |
| ---------------- | ------------------------------------------------------ |
| Background       | `bg-surface`                                          |
| Border           | `border-b border-border`                              |
| Border radius    | none                                                  |
| Text — primary   | `text-text-dark` (nav links, inactive)                |
| Text — active    | `text-accent` (nav link matching `activeRoute`)       |
| Text — hover     | `hover:text-accent`                                   |
| Spacing          | `h-16`, container `max-w-[1440px] px-8`, links `gap-8` |
| Hover state      | `hover:text-accent` on nav links                      |
| Shadow           | none                                                   |
| Accent usage     | dark CTA button on the right when logged out (see Button — Primary); `text-accent` on the active nav link when logged in |

**Pattern notes:**
Single component, two variants driven by required props `isAuthenticated: boolean` and optional `activeRoute?: string` — not a separate component. Logged-out: shows the dark "Start for free" CTA on the right, no link is ever marked active. Logged-in: CTA slot is replaced by `SignOutButton` (see below), and the nav link matching `activeRoute` gets `text-accent` instead of `text-text-dark`. Every page that renders an authenticated Navbar must pass its own route as `activeRoute` (e.g. the future `/dashboard` page passes `activeRoute="/dashboard"`) — there's no client-side `usePathname()` involved, this stays a Server Component. Logo is the raw `/logo.png` asset (icon + wordmark baked into one file) rendered via `next/image` at `h-9 w-auto`.

---

### Sign Out Button

File: components/layout/SignOutButton.tsx
Last updated: 2026-09-14

| Property         | Class                                                 |
| ---------------- | ------------------------------------------------------ |
| Background       | transparent (Ghost button — see ui-tokens.md)         |
| Text             | `text-text-secondary`                                 |
| Hover state      | `hover:bg-surface-secondary`                          |
| Border radius    | `rounded-md`                                          |
| Spacing          | `px-3 py-2`, `text-sm font-medium`                    |

**Pattern notes:**
No design mockup shows a sign-out control anywhere (checked `navbar_crop.png`/`dashboard.png` — both omit it), so this was built as the minimal, undesigned Ghost-button variant rather than inventing a heavier avatar/dropdown pattern. Client component (`"use client"`) — a `<form action={...}>` wrapping the existing `signOut` Server Action (`actions/auth.ts`), because `posthog.reset()` is browser-only (`posthog-js`) and has no server-side equivalent; it must run before the action's `redirect("/login")`. Rendered by `Navbar` only when `isAuthenticated` is true, in the slot the logged-out CTA occupies. Fires no new PostHog event — `posthog.reset()` isn't a capture, so it needed no addition to code-standards.md's Events table.

---

### Footer

File: components/layout/Footer.tsx
Last updated: 2026-09-07

| Property         | Class                                          |
| ---------------- | ----------------------------------------------- |
| Background       | `bg-surface`                                   |
| Border           | `border-t border-border`                       |
| Border radius    | none                                            |
| Text — secondary | `text-text-secondary`                          |
| Text — hover     | `hover:text-text-primary`                      |
| Spacing          | container `max-w-[1440px] px-8 py-8`, links `gap-6` |
| Hover state      | `hover:text-text-primary` on links             |
| Shadow           | none                                            |
| Accent usage     | none                                            |

**Pattern notes:**
Same logo treatment as Navbar. "Privacy Policy" and "Terms & Condition" link to `#` — those pages are explicitly out of scope per project-overview.md, so they're static text-only until/unless a page is added.

---

### Button — Primary (dark CTA)

File: components/homepage/CTAButtons.tsx, components/layout/Navbar.tsx

| Property      | Class                                                  |
| ------------- | ------------------------------------------------------- |
| Background    | `bg-overlay-dark`                                      |
| Text          | `text-accent-foreground` (white)                       |
| Border radius | `rounded-md`                                           |
| Spacing       | `px-4 py-2`                                             |
| Text size     | `text-sm font-medium`                                  |
| Hover state   | none defined yet                                       |
| Shadow        | none                                                    |

**Pattern notes:**
This is the near-black button in the design (Get Started, Start for free) — closest matching token to the design's near-black swatch is `--color-overlay-dark`, not `--color-accent`. Use `bg-overlay-dark` + `text-accent-foreground` for every primary/dark CTA button going forward, never a raw hex or `bg-black`. "Get Started" adds a trailing `▸` glyph inside the same button; "Start for free" does not.

### Button — Secondary (light CTA)

File: components/homepage/CTAButtons.tsx

| Property      | Class                     |
| ------------- | -------------------------- |
| Background    | `bg-accent-light`         |
| Text          | `text-text-primary`       |
| Border radius | `rounded-md`              |
| Spacing       | `px-4 py-2`                |
| Text size     | `text-sm font-medium`     |
| Hover state   | none defined yet          |
| Shadow        | none                      |

**Pattern notes:**
Used for the lower-emphasis CTA next to the primary dark button ("Find Your First Match"). Distinct from ui-tokens.md's documented "Secondary button" (white bg + border) — that pattern is reserved for form/app-chrome secondary actions, this lavender-tinted one is specific to marketing CTA pairs sitting on the gradient hero background.

`CTAButtons` takes a required `href: string` prop — both buttons link to the same destination, computed once by the page (`/dashboard` if `getCurrentUser()` returns a user, `/login` otherwise) and threaded down through `Hero`/`CTASection`'s own `ctaHref` prop. `CTAButtons` itself has no auth awareness — it only ever renders a link.

---

### Hero / CTA gradient section

File: app/globals.css (`.bg-hero-glow`), used by components/homepage/Hero.tsx and components/homepage/CTASection.tsx

| Property      | Class / value                                                                    |
| ------------- | --------------------------------------------------------------------------------- |
| Background    | `.bg-hero-glow` — two `radial-gradient()` layers built from `var(--color-accent-light)` and `var(--color-info-light)` over `var(--color-surface)` |
| Border        | none                                                                               |
| Border radius | none (full-bleed section)                                                         |
| Spacing       | container `max-w-[1440px] px-8`, section `py-20`                                  |

**Pattern notes:**
Matches the soft pink/blue wash behind the hero and bottom CTA in the design. Built with CSS variable references only (no hardcoded hex) per ui-tokens.md's "references CSS variable directly" allowance. Any future full-bleed gradient section should reuse `.bg-hero-glow` rather than inventing a new gradient.

---

### Feature row + highlighted item

File: components/homepage/Features.tsx

| Property         | Class                                                        |
| ---------------- | --------------------------------------------------------------- |
| Background       | `bg-surface` (section), `bg-surface-secondary` (screenshot card) |
| Border           | `border-t border-border` between items                       |
| Border radius    | `rounded-2xl` (screenshot card container)                     |
| Text — heading   | `text-3xl font-bold text-text-primary` (row heading), `text-base font-semibold text-text-primary` (item title) |
| Text — secondary | `text-sm text-text-secondary` (item description)              |
| Spacing          | row `gap-12`, items `py-6`, screenshot card `p-8`             |
| Accent usage     | highlighted item: `border-l-2 border-l-accent pl-4`           |

**Pattern notes:**
Two-column alternating layout (text + screenshot, order flipped on the second row via `order-1`/`order-2`). Exactly one item per row carries the `border-l-2 border-l-accent pl-4` treatment to match the design's single-highlighted-item pattern — don't highlight more than one item per row.

---

### Login card + OAuth buttons

File: app/(auth)/login/page.tsx
Last updated: 2026-09-08

| Property         | Class                                                                              |
| ---------------- | ----------------------------------------------------------------------------------- |
| Background       | Page: `bg-background`; card: `bg-surface`                                          |
| Border           | `border border-border` (card and OAuth buttons both)                               |
| Border radius    | `rounded-2xl` (card), `rounded-md` (buttons, error banner)                         |
| Text — primary   | `text-text-primary` (heading, button label)                                        |
| Text — secondary | `text-text-secondary` (subheading)                                                 |
| Spacing          | Card `p-6`, outer stack `gap-6`, button stack `gap-3`, buttons `px-4 py-2`         |
| Hover state      | `hover:bg-surface-secondary` on OAuth buttons                                      |
| Shadow           | `shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]` — same values as the ui-tokens.md Card spec, written inline since no `.shadow-card` utility exists yet |
| Accent usage     | None — intentionally neutral, no purple. Error state uses `bg-error/10 text-error` instead |

**Pattern notes:**
No design mockup exists for `/login` — built from ui-tokens.md's Card/Secondary-button patterns since none of the marketing CTA styles fit a neutral auth choice screen. Provider icons are inline SVGs (Google's official 4-color mark; GitHub's Octocat mark using `currentColor`) — `lucide-react` was installed but doesn't ship literal brand icons (`Github` isn't exported, only generic `Git*` icons), so don't reach for it for provider logos. Reuse this exact button style (border + `hover:bg-surface-secondary`) for any future OAuth-style or icon-plus-label choice button — it's a distinct pattern from both the dark marketing CTA and the lavender secondary CTA already in the registry.

---

### Profile page — CompletionIndicator, ResumeUpload, ProfileForm + sections

Files: app/profile/page.tsx, components/profile/CompletionIndicator.tsx, ResumeUpload.tsx, TagInput.tsx, ProfileForm.tsx, PersonalInfoSection.tsx, ProfessionalInfoSection.tsx, WorkExperienceSection.tsx, EducationSection.tsx, JobPreferencesSection.tsx, actions/profile.ts, lib/profile-mapping.ts
Last updated: 2026-09-14 (Resume preview + delete)

| Property           | Class                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Card (all sections) | `rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]` — same inline shadow value as the login card since no `.shadow-card` utility exists yet |
| Section heading     | `text-base font-semibold text-text-primary`                                                                |
| Field label         | `text-xs font-medium uppercase tracking-wide text-text-secondary`                                          |
| Input               | `rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent` |
| Disabled input (email) | same as Input + `cursor-not-allowed bg-surface-secondary text-text-secondary`                           |
| Tag pill (TagInput) | `rounded-full border border-border bg-surface-secondary px-3 py-1.5 text-sm text-text-primary`, remove `×` in `text-text-muted hover:text-text-primary` |
| Missing-field pill (CompletionIndicator) | `rounded-full bg-error/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-error` |
| Completion ring     | inline SVG, `text-error/15` track + `text-error` arc, both via `stroke="currentColor"` — no dedicated ring color token exists, reused `--color-error` per ui-tokens.md's "references CSS variable directly" allowance |
| Nested work-experience card | `rounded-2xl border border-border bg-surface-secondary p-4` (fields inside use `bg-surface` to stay legible against the tinted card) |
| Dashed upload dropzone | `rounded-2xl border border-dashed border-border-muted bg-surface-secondary` (default), `border-accent bg-accent-muted` while dragging |
| "Add role" / "Add" link | `text-accent hover:text-accent-dark` (Add role), `border border-border bg-surface-secondary text-text-primary hover:bg-border-light` (tag Add button — distinct from Add role, matches design's gray Add button vs. purple Add role link) |
| Save Profile / Generate Resume button | Primary: `bg-accent text-accent-foreground hover:bg-accent-dark` — same primary pattern as ui-tokens.md, `hover:bg-accent-dark` newly established here since no prior primary button had a defined hover state |

**Confirmed border-radius exceptions** (see ui-rules.md's Do Nots — 3-level nesting is normally disallowed, these two are the only approved exceptions since both trace directly to profile.png): `ResumeUpload.tsx`'s dropzone (outer card `rounded-2xl` → dashed dropzone `rounded-2xl` → "Select Resume" button `rounded-md`), and `WorkExperienceSection.tsx`'s nested entry cards (Profile Information card `rounded-2xl` → entry card `rounded-2xl` → inputs `rounded-md`). Do not use this as precedent for new 3-level nesting elsewhere without a mockup to point to.

**Completion states** (CompletionIndicator.tsx): two variants driven by `missingFields.length === 0`. Incomplete — `AlertCircle` icon, `text-error` ring, "Profile needs attention" heading, `bg-error/10 text-error` missing-field pills. Complete — `CheckCircle2` icon, `text-success` ring, "Profile complete" heading, no pills row. Both variants share the same card/ring/typography structure, only color tokens, icon, and copy swap.

**Empty state** (WorkExperienceSection.tsx, entries.length === 0): `rounded-2xl border-dashed border-border-muted bg-surface-secondary` box, muted `Briefcase` icon, `text-text-muted` message, secondary-style "Add role" button — same visual language as the Resume dropzone's empty state. Reuse this pattern for any other repeatable-list section that can start empty.

**Save state** (ProfileForm.tsx, new in Feature 06): no toast library, no `components/ui/` — a plain conditional line under the Save button, `text-success` on success / `text-error` on failure, using the same two color tokens as CompletionIndicator's states above. Button itself: `disabled={isPending}` (via `useTransition`) with its label swapping to "Saving..." while pending, `disabled:cursor-not-allowed disabled:opacity-60` added to the existing primary-button classes. This is the first "stay on the page and report success/failure inline" pattern in the codebase (Login's OAuth buttons are a pure redirect-flow and don't need one) — reuse this exact shape (`{status: "idle"|"success"|"error", message?}` state + `useTransition`) for any future in-page Server Action trigger rather than introducing a toast library.

**Resume preview + delete** (ResumeUpload.tsx, replaced the Feature 06 text-only indicator on 2026-09-14): once a resume exists — either just picked in this session (`pendingFile`) or already persisted (`existingResumeUrl`) — the dashed dropzone is swapped for a file-summary row (`rounded-md border border-border bg-surface-secondary px-4 py-3`: `FileText` icon in a `rounded-full border bg-surface` badge, filename, "Uploaded"/"Not yet saved" caption in `text-text-muted`) plus an inline `<iframe>` preview below it (`h-[480px] w-full rounded-md border border-border`). Actions on the right of the summary row, all `text-sm font-medium text-text-secondary`: "View" (`Eye` icon, opens the active preview URL in a new tab, only rendered if a preview URL exists), "Replace" (re-opens the file picker), "Remove" (`Trash2` icon, `hover:text-error`, only rendered when `existingResumeUrl` is set *and* there's no `pendingFile` — a pending, not-yet-saved replacement has nothing server-side to delete yet, and showing Remove during that window would let a click silently discard the pending selection along with the old file). The dashed dropzone only renders when there's no resume at all (pending or persisted) — no 3-level radius nesting here, unlike the dropzone-only state below. Preview URL resolution: a not-yet-saved `pendingFile` previews via a client-side `URL.createObjectURL()` (computed with `useMemo`, revoked in a cleanup-only `useEffect` — never call `setState` inside the effect body itself, `react-hooks/set-state-in-effect` flags it); a persisted resume previews via a signed URL the server mints with `createSignedUrl()` — once on page load (`app/profile/page.tsx`) and again after every successful save (`actions/profile.ts`'s `saveProfile` now returns `resumePreviewUrl` alongside `resumePdfUrl`) so the UI never needs a manual refresh to see its own upload. Deleting calls a new `deleteResume()` Server Action (`actions/profile.ts`) gated by `window.confirm()` — no confirm-dialog component exists in the codebase yet, so this stays a native browser confirm rather than a new dependency.

**Extract from Resume + review panel** (ResumeUpload.tsx / ExtractionReviewPanel.tsx, new in Feature 07, 2026-09-15; row styling corrected in `/review` follow-up same day): once a resume exists (`hasResume`), a new callout row sits between the file-summary row and the `<iframe>` preview — `rounded-md border border-accent-light bg-accent-muted px-4 py-3`, explanatory copy on the left, a primary `Sparkles`-icon button on the right (`Extract from Resume` → `Extracting...` while pending, same `disabled:cursor-not-allowed disabled:opacity-60` pattern as Save Profile). An extraction error renders as a plain `text-sm text-error` line below the callout, same convention as the existing upload-validation `error` state in this file. When extraction finds fields that already hold a different value, `ExtractionReviewPanel.tsx` renders inside the Profile Information card, above the section list — reuses the same `bg-accent-muted`/`border-accent-light` treatment as the callout above (same "AI feature" visual language as the accent-light "Tailored" badge in ui-tokens.md), one row per conflicting field: a checkbox (checked by default), the field label, the old value in `text-text-muted line-through`, the new value in `text-text-primary` beneath it. Rows are separated with `divide-y divide-border` (plain top/bottom borders on the list, no per-row `rounded-md` box) rather than each row being its own bordered/rounded card — a card-inside-panel-inside-card would be a third nested border-radius level with no mockup basis, which `ui-rules.md`'s 2-level cap doesn't allow; `divide-y` is the same separator pattern `ProfileForm.tsx`'s own section list already uses for the same reason. "Discard"/"Apply Selected" buttons at the bottom follow the standard Secondary/Primary button pair. Fields that are currently empty skip this panel entirely and fill silently — only fields that would overwrite an existing value show up here. This is the first review/diff-style panel in the codebase — reuse this shape (inline panel, no modal, whole-field granularity, checkbox-per-row defaulting checked, `divide-y` rows rather than nested cards) for any future AI-suggests-changes-to-existing-data flow rather than introducing a modal/dialog dependency.

**Pattern notes:**
`ProfileForm.tsx` is the single client component (`"use client"`) owning all form state (one `Profile` object) and composing `CompletionIndicator`, `ResumeUpload`, and the five section components — the completion ring and missing-field tags recompute live via `lib/profile-completion.ts`'s `computeProfileCompletion()` as the user edits fields, they are not static. Section components (`PersonalInfoSection.tsx` etc.) are plain presentational functions taking `profile` + `onChange(patch)` — no `"use client"` directive of their own needed since they're only ever rendered inside the already-client `ProfileForm`. `TagInput.tsx` is the one reusable input pattern (used for Skills and Industries) — "Job Titles Seeking" and "Preferred Locations" are plain text inputs, not tag/chip UI, matching profile.png exactly (Feature 06's Server Action converts these two to/from `text[]` via comma-split/join at the DB boundary — the UI-facing type stays a plain string). `ResumePreview.tsx` (listed in architecture.md's folder sketch) was never built as a separate file — its job is now done inline by `ResumeUpload.tsx`'s `<iframe>` (see above) rather than a dedicated component, since there was never a design spec calling for one to be separate. `build-plan.md`'s Feature 05 text mentions a "Cover Letter Tone dropdown" under Job Preferences that does not appear anywhere in `profile.png` — built exactly what the mockup shows (Job Titles Seeking, Remote Preference, Salary Expectation, Preferred Locations only) rather than inventing a field with no visual spec; flagged in progress-tracker.md.

`inputClass`/`labelClass` are centralized in `lib/form-styles.ts` (not repeated per file) — every profile form field imports both from there rather than redefining the strings locally. Reuse this file for any future form-heavy page rather than re-inlining the same classes again. Every `<label>` in the profile form is associated with its input via matching `htmlFor`/`id` (static ids for single-instance fields; `${entry.id}-<field>` for repeatable Work Experience rows; `TagInput` generates its id via React's `useId()` since it's reused twice on one page) — clicking a label focuses its field. `<select>` `onChange` handlers that narrow `event.target.value` to a union type (`ExperienceLevel`/`WorkAuthorization`/`RemotePreference`) always carry a one-line comment explaining why the assertion is safe, per code-standards.md's "never use type assertions ... unless commented why" — follow this exact comment pattern for any future dropdown.

`actions/profile.ts` and `lib/profile-mapping.ts` (Feature 06, no visual component but part of this feature's file set) — `mapProfileRowToUi`/`mapProfileInputToDbPayload` are the single source of truth for the camelCase(UI)↔snake_case(DB) boundary; any future feature reading or writing `profiles` should import from here rather than re-deriving the mapping.

`lib/resume-extraction.ts` (Feature 07, server-only — imports `pdf-parse`) and `lib/extraction-review.ts` (Feature 07, client-safe — the diff/summarize logic `ProfileForm.tsx` calls) are deliberately separate files, not one module: keeping the pdf-parse import out of anything the client component touches avoids accidentally pulling server-only code into the browser bundle. `types/index.ts`'s `ExtractedProfileFields` is the shared boundary type between them (and the `/api/resume/extract` route's JSON response) — always fully populated with empty defaults (`""`, `[]`, `0`) rather than partial/optional keys, so `diffExtractedFields` never has to distinguish "not extracted" from "not present."

`lib/constants.ts` (new in Feature 07's `/review` follow-up) centralizes cross-file magic numbers — `MAX_RESUME_SIZE_BYTES`, `MAX_WORK_EXPERIENCE_ENTRIES` — that had drifted into 3 independent copies each (`ResumeUpload.tsx`, `actions/profile.ts`, `app/api/resume/extract/route.ts`, `ProfileForm.tsx`, `lib/resume-extraction.ts`). Add any future cross-file constant here rather than re-declaring it locally. `lib/profile-options.ts` centralizes the `experienceLevel` enum's value↔label pairs (`EXPERIENCE_LEVEL_OPTIONS`, `experienceLevelLabel()`) — previously a `<select>`-only concern living inside `ProfessionalInfoSection.tsx`, now also needed by `lib/extraction-review.ts` to show human-readable labels in the review panel instead of raw enum values.

---

### Page container convention

Used across all homepage sections.

```
mx-auto max-w-[1440px] px-8
```

**Pattern notes:**
Matches ui-rules.md's "Page max-width: 1440px, centered" and "Main content area padding: 32px" (`px-8` = 32px). Apply this exact class combination as the outer wrapper for every full-bleed section's inner content going forward — keeps section content aligned across the whole page regardless of each section's background.
