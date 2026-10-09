import { browserbase } from "@browserbasehq/stagehand";

const SEARCH_TIMEOUT_MS = 8_000;
const SEARCH_RESULTS = 5;
const MIN_TOKEN_LENGTH = 3;

// Sites that show up in a "<company> official website" search but are never the company's own
// site — job boards, ATS vendors, social/profile pages, data aggregators, encyclopedias.
const NON_EMPLOYER_DOMAINS = new Set([
  "indeed.com",
  "linkedin.com",
  "glassdoor.com",
  "ziprecruiter.com",
  "monster.com",
  "careerbuilder.com",
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workable.com",
  "smartrecruiters.com",
  "jobvite.com",
  "icims.com",
  "myworkdayjobs.com",
  "bamboohr.com",
  "recruitee.com",
  "breezy.hr",
  "jazzhr.com",
  "applytojob.com",
  "taleo.net",
  "adzuna.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "github.com",
  "wikipedia.org",
  "crunchbase.com",
  "bloomberg.com",
  "tracxn.com",
  "zoominfo.com",
  "dnb.com",
  "mapquest.com",
  "yelp.com",
  "reddit.com",
  "medium.com",
  "pitchbook.com",
  "owler.com",
  "comparably.com",
  "levels.fyi",
  "builtin.com",
]);

// Registries that put the registrable domain one label deeper (example.co.uk). Not a full
// public-suffix list — covers the countries Adzuna serves.
const TWO_LEVEL_SUFFIXES = new Set(["co.uk", "org.uk", "com.au", "co.nz", "co.za", "com.br", "com.sg", "co.in"]);

const COMPANY_SUFFIX_WORDS = new Set([
  "inc",
  "llc",
  "ltd",
  "limited",
  "corp",
  "corporation",
  "co",
  "company",
  "gmbh",
  "plc",
  "group",
  "holdings",
  "the",
]);

export function parseHttpUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function rootDomain(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/\.$/, "").split(".");
  if (labels.length <= 2) return labels.join(".");
  const lastTwo = labels.slice(-2).join(".");
  return TWO_LEVEL_SUFFIXES.has(lastTwo) ? labels.slice(-3).join(".") : lastTwo;
}

function companyTokens(company: string): string[] {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !COMPANY_SUFFIX_WORDS.has(word));
}

// Best-effort fallback when search finds nothing: "Acme, Inc." -> https://www.acme.com
export function guessHomepageFromCompanyName(company: string): string | null {
  const slug = companyTokens(company).join("");
  return slug ? `https://www.${slug}.com` : null;
}

// A search hit only counts if its domain name visibly relates to the company ("Block, Inc." ->
// block.xyz, "Booz Allen Hamilton" -> boozallen.com). Without this, a made-up or obscure
// company name would adopt whatever unrelated site the search engine ranks first.
function domainMatchesCompany(hostname: string, tokens: string[]): boolean {
  const root = rootDomain(hostname);
  const label = root.split(".")[0];
  const slug = tokens.join("");
  if (!label || !slug) return false;
  if (slug.includes(label) && label.length >= MIN_TOKEN_LENGTH) return true;
  return tokens.some((token) => token.length >= MIN_TOKEN_LENGTH && label.includes(token));
}

async function searchOfficialSite(company: string): Promise<string | null> {
  const tokens = companyTokens(company);
  if (tokens.length === 0) return null;

  const search = browserbase.search({
    query: `${company} official website`,
    numResults: SEARCH_RESULTS,
    apiKey: process.env.BROWSERBASE_API_KEY!,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("search timed out")), SEARCH_TIMEOUT_MS);
  });

  try {
    const { results } = await Promise.race([search, timeout]);
    for (const result of results) {
      const url = parseHttpUrl(result.url);
      if (!url) continue;
      const root = rootDomain(url.hostname);
      if (NON_EMPLOYER_DOMAINS.has(root)) continue;
      if (domainMatchesCompany(url.hostname, tokens)) return `https://${root}`;
    }
    return null;
  } finally {
    clearTimeout(timer);
    // If the timeout won the race, the search promise may still reject later — swallow it.
    search.catch(() => undefined);
  }
}

export type CompanyHomepage = { url: string | null; derivedFrom: "search" | "company-name" | "none" };

// Adzuna's tracking links answer automated requests with 403, so the employer can't be read
// from the redirect. Instead: Browserbase Search for the official site (free-plan allowance is
// limited, so any failure just falls through), then a name-based guess. This server never
// fetches the employer's site itself — only the Browserbase browser does.
export async function resolveCompanyHomepage(company: string): Promise<CompanyHomepage> {
  try {
    const found = await searchOfficialSite(company);
    if (found) return { url: found, derivedFrom: "search" };
  } catch {
    // Fall through to the company-name guess.
  }

  const guess = guessHomepageFromCompanyName(company);
  return guess ? { url: guess, derivedFrom: "company-name" } : { url: null, derivedFrom: "none" };
}
