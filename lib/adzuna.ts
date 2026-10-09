export type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted: "0" | "1";
  contract_type?: string;
  created: string;
  category: { tag: string; label: string };
};

export type AdzunaCountry = "us" | "gb" | "au" | "ca";

const COUNTRY_KEYWORDS: Record<Exclude<AdzunaCountry, "us">, string[]> = {
  gb: ["uk", "united kingdom", "england", "scotland", "wales", "london", "manchester", "britain"],
  ca: ["canada", "toronto", "vancouver", "montreal", "ottawa"],
  au: ["australia", "sydney", "melbourne", "brisbane", "perth"],
};

// No geocoding library is approved for this project (code-standards.md) — this is a
// deliberately lightweight keyword match against Adzuna's supported country codes,
// not a general-purpose location parser. Defaults to "us" per build-plan.md.
export function detectCountryFromLocation(location: string): AdzunaCountry {
  const normalized = location.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS) as [
    Exclude<AdzunaCountry, "us">,
    string[],
  ][]) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return country;
  }
  return "us";
}

export async function searchJobs(
  jobTitle: string,
  location: string,
  country: AdzunaCountry = "us",
): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    what: jobTitle,
    category: "it-jobs",
    results_per_page: "10",
    "content-type": "application/json",
  });

  if (location) {
    params.set("where", location);
  }

  const response = await fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`);

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
