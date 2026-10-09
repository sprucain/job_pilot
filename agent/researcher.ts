import { browserbase, type Page, Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

import { parseHttpUrl, rootDomain } from "@/lib/company-url";
import { veniceStagehandModel } from "@/lib/stagehand-model";

const MAX_SUB_PAGES = 3;
// Browserbase session length (seconds; the API minimum is 60). Our own deadline below fires well before this.
const SESSION_TIMEOUT_SECONDS = 120;
const MAX_ITEM_CHARS = 400;
const MAX_ITEMS = 10;

const LINK_KINDS = ["about", "careers", "blog", "engineering", "product", "team", "other"] as const;
type LinkKind = (typeof LINK_KINDS)[number];

// Careers pages are mostly the job posting we already have — visit them last.
const LINK_KIND_PRIORITY: Record<LinkKind, number> = {
  about: 0,
  product: 1,
  engineering: 2,
  blog: 3,
  team: 4,
  other: 5,
  careers: 6,
};

const homepageSchema = z.object({
  oneLiner: z.string().describe("What the company does in one sentence"),
  productSummary: z.string().describe("What they build/sell and who it's for"),
  signals: z.array(z.string()).describe("Funding, notable customers, scale, mission, recent news"),
  pageLinks: z
    .array(z.object({ url: z.string(), kind: z.enum(LINK_KINDS) }))
    .describe("Internal links worth visiting"),
});

const subPageSchema = z.object({
  keyPoints: z.array(z.string()),
  technologies: z.array(z.string()).describe("Specific languages, frameworks, tools, platforms"),
  valuesOrCulture: z.array(z.string()).describe("Stated values, working style, team norms"),
  notable: z.array(z.string()).describe("Customers, funding, scale, projects, awards"),
});

const HOMEPAGE_INSTRUCTION =
  "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.";

const SUB_PAGE_INSTRUCTION =
  "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.";

export type PageResearch = z.infer<typeof subPageSchema> & { url: string };

export type CompanyResearchData = {
  homepage: { url: string; oneLiner: string; productSummary: string; signals: string[] };
  pages: PageResearch[];
};

// code-standards.md: agent functions return { success, error? }. `empty` separates "the site
// had nothing usable" (expected, e.g. a wrong guessed domain) from a genuine failure, since the
// route logs them differently — both lead to the same fallback (synthesis without site research).
export type ResearchOutcome =
  | { success: true; data: CompanyResearchData }
  | { success: false; empty: boolean; error: string };

class DeadlineError extends Error {}

// A load that fails at the network layer (dead domain, refused tunnel) can resolve to Chrome's
// own error page rather than throwing — and the model would happily "extract" that page. Only
// a real, successful HTTP response counts as a page worth reading.
async function gotoUsable(page: Page, url: string, deadline: number): Promise<boolean> {
  const response = await withDeadline(page.goto(url, { waitUntil: "domcontentloaded" }), deadline);
  return response !== null && response.status() < 400;
}

type StagehandSchema = Parameters<Stagehand["extract"]>[1];

// Stagehand bundles its own zod copy, so our schemas are structurally right but nominally
// different types to it — hand the schema over through a cast, then re-validate the model's
// answer against OUR schema so the return value is typed and trusted only after parsing.
async function extractTyped<T extends z.ZodType>(
  stagehand: Stagehand,
  instruction: string,
  schema: T,
): Promise<z.output<T>> {
  const { data } = await stagehand.extract(instruction, schema as unknown as StagehandSchema);
  return schema.parse(data);
}

function withDeadline<T>(promise: Promise<T>, deadline: number): Promise<T> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) return Promise.reject(new DeadlineError("Research deadline reached"));
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new DeadlineError("Research deadline reached")), remaining);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Closing hands the session back to Browserbase; it must never be able to stall the request.
const CLOSE_TIMEOUT_MS = 5_000;

async function closeQuietly(close: (() => Promise<void>) | undefined): Promise<void> {
  if (!close) return;
  await Promise.race([
    close().catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, CLOSE_TIMEOUT_MS).unref?.()),
  ]);
}

// Scraped text ends up in an LLM prompt — keep it bounded.
function clip(items: string[]): string[] {
  return items
    .map((item) => item.trim().slice(0, MAX_ITEM_CHARS))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

// The model often returns no links at all for a nav-heavy homepage, so also read the anchors
// straight from the DOM and classify them by keyword. Deterministic, no extra LLM call.
const KIND_KEYWORDS: [LinkKind, RegExp][] = [
  ["about", /\b(about|company|who-we-are|our-story|mission)\b/i],
  ["engineering", /\b(engineering|developers?|tech(nology)?)\b/i],
  ["product", /\b(products?|platform|solutions?|features)\b/i],
  ["blog", /\b(blog|news|stories|insights)\b/i],
  ["team", /\b(team|people|leadership)\b/i],
  ["careers", /\b(careers?|jobs|join)\b/i],
];

async function collectDomLinks(page: Page): Promise<{ url: string; kind: LinkKind }[]> {
  const anchors = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .slice(0, 300)
      .map((anchor) => ({ href: (anchor as HTMLAnchorElement).href, text: anchor.textContent ?? "" })),
  );
  const links: { url: string; kind: LinkKind }[] = [];
  for (const anchor of anchors) {
    const url = parseHttpUrl(anchor.href);
    if (!url) continue;
    const haystack = `${url.pathname.replace(/[/_]/g, " ")} ${anchor.text.slice(0, 40)}`;
    const match = KIND_KEYWORDS.find(([, pattern]) => pattern.test(haystack));
    if (match) links.push({ url: url.toString(), kind: match[0] });
  }
  return links;
}

function pickSubPageUrls(homepageUrl: string, links: { url: string; kind: LinkKind }[]): string[] {
  const home = new URL(homepageUrl);
  const homeRoot = rootDomain(home.hostname);
  const seen = new Set<string>([home.origin + "/"]);
  const candidates: { url: string; kind: LinkKind; priority: number }[] = [];

  for (const link of links) {
    // Model- and DOM-supplied hrefs can be malformed — skip those, never throw.
    let resolved: URL | null;
    try {
      resolved = parseHttpUrl(new URL(link.url, home).toString());
    } catch {
      continue;
    }
    if (!resolved || rootDomain(resolved.hostname) !== homeRoot) continue;
    resolved.hash = "";
    const key = resolved.toString();
    if (seen.has(key) || seen.has(key.replace(/\/$/, "") + "/")) continue;
    seen.add(key);
    candidates.push({ url: key, kind: link.kind, priority: LINK_KIND_PRIORITY[link.kind] });
  }

  candidates.sort((a, b) => a.priority - b.priority);
  // One page per kind first (best coverage), then fill any remaining slots in priority order.
  const onePerKind = candidates.filter((candidate, index) => candidates.findIndex((c) => c.kind === candidate.kind) === index);
  const rest = candidates.filter((candidate) => !onePerKind.includes(candidate));
  return [...onePerKind, ...rest].slice(0, MAX_SUB_PAGES).map((candidate) => candidate.url);
}

// One Browserbase session: homepage, then at most MAX_SUB_PAGES sub-pages. Never throws —
// the caller always proceeds to synthesis, with or without site research. `deadlineMs` caps
// the whole browser phase; whatever was collected before it fires is still returned.
export async function researchCompanySite(homepageUrl: string, deadlineMs: number): Promise<ResearchOutcome> {
  const deadline = Date.now() + deadlineMs;
  let homepage: CompanyResearchData["homepage"] | null = null;
  const pages: PageResearch[] = [];
  let failure: string | null = null;

  const launching = browserbase.launch({ apiKey: process.env.BROWSERBASE_API_KEY!, api_timeout: SESSION_TIMEOUT_SECONDS });
  let browser: Awaited<typeof launching>;
  try {
    browser = await withDeadline(launching, deadline);
  } catch (error) {
    // A launch that loses the race can still finish later — close that session when it does,
    // otherwise it would sit open (billable) until its api_timeout.
    launching.then((late) => closeQuietly(() => late.close())).catch(() => undefined);
    return {
      success: false,
      empty: false,
      error: `browser launch failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  let stagehand: Stagehand | null = null;
  try {
    stagehand = await withDeadline(Stagehand.create({ browser, model: veniceStagehandModel }), deadline);
    const [page] = await browser.context.pages();

    if (!(await gotoUsable(page, homepageUrl, deadline))) {
      return { success: false, empty: true, error: `${homepageUrl} did not return a usable page` };
    }
    const data = await withDeadline(extractTyped(stagehand, HOMEPAGE_INSTRUCTION, homepageSchema), deadline);

    // Empty on both = wrong site or parked domain — skip browsing it any further.
    if (!data.oneLiner.trim() && !data.productSummary.trim()) {
      return { success: false, empty: true, error: `No usable content at ${homepageUrl}` };
    }

    homepage = {
      url: homepageUrl,
      oneLiner: data.oneLiner.trim().slice(0, MAX_ITEM_CHARS),
      productSummary: data.productSummary.trim().slice(0, MAX_ITEM_CHARS * 2),
      signals: clip(data.signals),
    };

    const domLinks = await withDeadline(collectDomLinks(page), deadline).catch((error: unknown) => {
      if (error instanceof DeadlineError) throw error;
      return [];
    });
    for (const url of pickSubPageUrls(homepageUrl, [...data.pageLinks, ...domLinks])) {
      try {
        if (!(await gotoUsable(page, url, deadline))) continue;
        const result = await withDeadline(extractTyped(stagehand, SUB_PAGE_INSTRUCTION, subPageSchema), deadline);
        pages.push({
          url,
          keyPoints: clip(result.keyPoints),
          technologies: clip(result.technologies),
          valuesOrCulture: clip(result.valuesOrCulture),
          notable: clip(result.notable),
        });
      } catch (error) {
        if (error instanceof DeadlineError) throw error;
        failure = `sub-page ${url} failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  } finally {
    // Close in finally so a failed or timed-out run never leaves a billable session open —
    // bounded, so a hung close can't push the request past the route's maxDuration.
    await closeQuietly(stagehand ? () => stagehand!.close() : undefined);
    await closeQuietly(() => browser.close());
  }

  // Whatever was collected before a deadline or sub-page failure is still worth using.
  if (homepage) return { success: true, data: { homepage, pages } };
  return { success: false, empty: false, error: failure ?? "no homepage content" };
}
