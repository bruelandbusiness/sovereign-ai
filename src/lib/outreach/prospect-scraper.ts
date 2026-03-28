/**
 * Prospect Scraper — SerpAPI Google Maps integration.
 *
 * Searches Google Maps for businesses matching a vertical + city query,
 * extracts structured data, and optionally enriches each result with
 * email/owner information from website scraping and Hunter.io.
 *
 * Rate-limited to 1 request per second to respect API and target site limits.
 */

import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type {
  ProspectData,
  ScrapeJobParams,
  ScrapeJobResult,
  SerpApiMapsResponse,
  SerpApiLocalResult,
} from "./types";

const TAG = "[prospect-scraper]";

const SERPAPI_BASE_URL = "https://serpapi.com/search.json";
const RATE_LIMIT_MS = 1_000; // 1 request per second
const DEFAULT_LIMIT = 20;
const SERPAPI_PAGE_SIZE = 20; // SerpAPI returns ~20 results per page

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
  return fetchWithTimeout(url, { method: "GET", headers: { Accept: "application/json" } }, 15_000);
}

// ---------------------------------------------------------------------------
// Main scrape function
// ---------------------------------------------------------------------------

/**
 * Scrape Google Maps for prospects matching a vertical + city query.
 *
 * Uses SerpAPI Google Maps engine with pagination support. Each result is
 * optionally enriched with email data from website scraping and Hunter.io.
 */
export async function scrapeProspects(
  params: ScrapeJobParams,
): Promise<ScrapeJobResult> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return { prospects: [], totalFound: 0, totalStored: 0, totalDuplicates: 0, query: `${params.vertical} in ${params.city}, ${params.state}` };
  }

  const { vertical, city, state, limit = DEFAULT_LIMIT } = params;
  const query = `${vertical} in ${city}, ${state}`;

  logger.info(`${TAG} Starting scrape`, { query, limit });

  const allProspects: ProspectData[] = [];
  let start = 0;

  // Paginate through SerpAPI results until we reach the requested limit
  while (allProspects.length < limit) {
    const url = buildSerpApiUrl(apiKey, query, start);

    let response: Response;
    try {
      response = await rateLimitedFetch(url);
    } catch (err) {
      logger.errorWithCause(`${TAG} SerpAPI request failed`, err, { query, start });
      break;
    }

    if (!response.ok) {
      logger.warn(`${TAG} SerpAPI returned ${response.status}`, {
        query,
        start,
        status: response.status,
      });
      break;
    }

    const data = (await response.json()) as SerpApiMapsResponse;
    const localResults = data.local_results ?? [];

    if (localResults.length === 0) {
      logger.info(`${TAG} No more results from SerpAPI`, { query, start });
      break;
    }

    for (const result of localResults) {
      if (allProspects.length >= limit) break;
      const prospect = mapLocalResult(result);
      allProspects.push(prospect);
    }

    // Check if there's a next page
    if (!data.serpapi_pagination?.next) {
      break;
    }

    start += SERPAPI_PAGE_SIZE;
  }

  logger.info(`${TAG} Scrape complete`, {
    query,
    totalFound: allProspects.length,
  });

  // Enrich prospects with website data and email lookup
  const enrichedProspects = await enrichProspectBatch(allProspects);

  return {
    query,
    totalFound: enrichedProspects.length,
    totalStored: 0, // Caller updates after DB insert
    totalDuplicates: 0,
    prospects: enrichedProspects,
  };
}

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

function buildSerpApiUrl(apiKey: string, query: string, start: number): string {
  const url = new URL(SERPAPI_BASE_URL);
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  if (start > 0) {
    url.searchParams.set("start", String(start));
  }
  return url.toString();
}

// ---------------------------------------------------------------------------
// Map SerpAPI result to ProspectData
// ---------------------------------------------------------------------------

function mapLocalResult(result: SerpApiLocalResult): ProspectData {
  const googleMapsUrl =
    result.link ??
    (result.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${result.place_id}`
      : null);

  return {
    businessName: result.title ?? "Unknown Business",
    address: result.address ?? null,
    phone: result.phone ?? null,
    website: result.website ?? null,
    rating: result.rating ?? null,
    reviewCount: result.reviews ?? null,
    googleMapsUrl,
    placeId: result.place_id ?? null,
    gpsCoordinates: result.gps_coordinates ?? null,
    ownerName: null,
    email: null,
    emailVerified: false,
    emailSource: null,
  };
}

// ---------------------------------------------------------------------------
// Batch enrichment (website scrape + Hunter.io)
// ---------------------------------------------------------------------------

async function enrichProspectBatch(
  prospects: ProspectData[],
): Promise<ProspectData[]> {
  const enriched: ProspectData[] = [];

  for (const prospect of prospects) {
    try {
      const result = await enrichSingleProspect(prospect);
      enriched.push(result);
    } catch (err) {
      logger.errorWithCause(`${TAG} Enrichment failed for ${prospect.businessName}`, err);
      enriched.push(prospect); // Keep un-enriched
    }

    // Rate limit enrichment requests too
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
  }

  return enriched;
}

async function enrichSingleProspect(
  prospect: ProspectData,
): Promise<ProspectData> {
  // Step 1: Try to scrape the website for email/owner info
  if (prospect.website) {
    const websiteData = await scrapeWebsiteForContact(prospect.website);
    if (websiteData.email) {
      prospect.email = websiteData.email;
      prospect.emailSource = "website_scrape";
    }
    if (websiteData.ownerName) {
      prospect.ownerName = websiteData.ownerName;
    }
  }

  // Step 2: If no email found yet, try Hunter.io
  if (!prospect.email && prospect.website) {
    const hunterResult = await tryHunterEmailFinder(prospect.website);
    if (hunterResult.email) {
      prospect.email = hunterResult.email;
      prospect.emailVerified = hunterResult.verified;
      prospect.emailSource = "hunter";
    }
  }

  return prospect;
}

// ---------------------------------------------------------------------------
// Website scraping for contact info
// ---------------------------------------------------------------------------

interface WebsiteContactData {
  email: string | null;
  ownerName: string | null;
}

/**
 * Fetch a website's homepage and extract email addresses and potential
 * owner names using regex patterns. This is a lightweight heuristic;
 * it won't catch every site but covers common patterns.
 */
async function scrapeWebsiteForContact(
  websiteUrl: string,
): Promise<WebsiteContactData> {
  const result: WebsiteContactData = { email: null, ownerName: null };

  try {
    // Normalize URL
    let url = websiteUrl;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SovereignAI/1.0; +https://trysovereignai.com)",
        Accept: "text/html",
      },
    }, 10_000);

    if (!response.ok) return result;

    const html = await response.text();

    // Extract email addresses
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex);

    if (emails && emails.length > 0) {
      // Filter out common non-personal emails and pick the best one
      const personalEmails = emails.filter((e) => {
        const lower = e.toLowerCase();
        return (
          !lower.includes("noreply") &&
          !lower.includes("no-reply") &&
          !lower.includes("example.com") &&
          !lower.includes("sentry.io") &&
          !lower.includes("wixpress.com") &&
          !lower.endsWith(".png") &&
          !lower.endsWith(".jpg")
        );
      });

      if (personalEmails.length > 0) {
        // Prefer emails that look like a person (info@, owner@, contact@, or personal)
        const ranked = personalEmails.sort((a, b) => {
          const scoreEmail = (e: string): number => {
            const l = e.toLowerCase();
            if (l.startsWith("owner")) return 4;
            if (l.startsWith("info")) return 3;
            if (l.startsWith("contact")) return 2;
            // Anything else may be a personal email
            return 1;
          };
          return scoreEmail(b) - scoreEmail(a);
        });
        result.email = ranked[0];
      }
    }

    // Try to extract owner/person name from common patterns
    const ownerPatterns = [
      /(?:owner|founded?\s+by|ceo|president|principal)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
      /<meta\s+name="author"\s+content="([^"]+)"/i,
    ];

    for (const pattern of ownerPatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const name = match[1].trim();
        // Sanity check: names should be 3-50 chars
        if (name.length >= 3 && name.length <= 50) {
          result.ownerName = name;
          break;
        }
      }
    }
  } catch (err) {
    logger.warn(`${TAG} Website scrape failed for ${websiteUrl}`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Hunter.io email finder
// ---------------------------------------------------------------------------

interface HunterResult {
  email: string | null;
  verified: boolean;
}

/**
 * Use Hunter.io's domain search endpoint to find an email for a website.
 * Uses the existing ENRICHMENT_EMAIL_FINDER_KEY env var.
 */
async function tryHunterEmailFinder(website: string): Promise<HunterResult> {
  const apiKey = process.env.ENRICHMENT_EMAIL_FINDER_KEY;
  if (!apiKey) {
    return { email: null, verified: false };
  }

  try {
    // Extract domain from website URL
    let domain: string;
    try {
      const parsed = new URL(
        website.startsWith("http") ? website : `https://${website}`,
      );
      domain = parsed.hostname.replace(/^www\./, "");
    } catch {
      return { email: null, verified: false };
    }

    const baseUrl =
      process.env.ENRICHMENT_EMAIL_FINDER_URL ??
      "https://api.hunter.io/v2/domain-search";

    const url = new URL(baseUrl);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("domain", domain);
    url.searchParams.set("limit", "1");

    const response = await rateLimitedFetch(url.toString());

    if (!response.ok) {
      return { email: null, verified: false };
    }

    const data = await response.json();
    const emails = data?.data?.emails;

    if (Array.isArray(emails) && emails.length > 0) {
      const best = emails[0];
      return {
        email: best.value ?? null,
        verified: (best.confidence ?? 0) >= 80,
      };
    }
  } catch (err) {
    logger.warn(`${TAG} Hunter.io lookup failed for ${website}`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { email: null, verified: false };
}
