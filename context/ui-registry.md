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
Last updated: 2026-09-08

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
Single component, two variants driven by required props `isAuthenticated: boolean` and optional `activeRoute?: string` — not a separate component. Logged-out: shows the dark "Start for free" CTA on the right, no link is ever marked active. Logged-in: CTA is omitted entirely (no avatar/user-menu — out of scope, no design spec for one), and the nav link matching `activeRoute` gets `text-accent` instead of `text-text-dark`. Every page that renders an authenticated Navbar must pass its own route as `activeRoute` (e.g. the future `/dashboard` page passes `activeRoute="/dashboard"`) — there's no client-side `usePathname()` involved, this stays a Server Component. Logo is the raw `/logo.png` asset (icon + wordmark baked into one file) rendered via `next/image` at `h-9 w-auto`. No sign-out control exists anywhere yet — flagged as an open gap, not built here since no build-plan feature specs one.

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

### Page container convention

Used across all homepage sections.

```
mx-auto max-w-[1440px] px-8
```

**Pattern notes:**
Matches ui-rules.md's "Page max-width: 1440px, centered" and "Main content area padding: 32px" (`px-8` = 32px). Apply this exact class combination as the outer wrapper for every full-bleed section's inner content going forward — keeps section content aligned across the whole page regardless of each section's background.
