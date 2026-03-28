import { logger } from "@/lib/logger";
import type { ProspectInput } from "./index";

const GOOGLE_PLACES_API_URL =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";

const MIN_REVIEWS = 10; // AGENTS.md: minimum 10 Google reviews to qualify as "established"
const MAX_REVIEWS = 500;
const MAX_RESULTS = 50;

interface PlaceResult {
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  business_status?: string;
  types?: string[];
}

interface PlacesResponse {
  results: PlaceResult[];
  status: string;
  next_page_token?: string;
}

/**
 * Scrape potential contractor clients using Google Places API.
 *
 * If GOOGLE_PLACES_API_KEY is not configured, logs a warning
 * and returns an empty array.
 */
export async function scrapeContractors(params: {
  vertical?: string;
  city?: string;
  state?: string;
}): Promise<ProspectInput[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    logger.warn(
      "[prospect-finder] GOOGLE_PLACES_API_KEY not configured, skipping scrape"
    );
    return [];
  }

  const verticalLabel = params.vertical || "home services";
  const locationParts = [params.city, params.state].filter(Boolean);
  const locationLabel = locationParts.length > 0 ? locationParts.join(", ") : "US";

  const query = `${verticalLabel} contractor near ${locationLabel}`;

  logger.info("[prospect-finder] Searching Google Places", { query });

  const prospects: ProspectInput[] = [];
  let nextPageToken: string | undefined;

  // Paginate through results (Google returns max 20 per page, up to 3 pages)
  for (let page = 0; page < 3 && prospects.length < MAX_RESULTS; page++) {
    const url = new URL(GOOGLE_PLACES_API_URL);
    url.searchParams.set("query", query);
    url.searchParams.set("key", apiKey);
    if (nextPageToken) {
      url.searchParams.set("pagetoken", nextPageToken);
    }

    try {
      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        logger.error("[prospect-finder] Google Places API error", {
          status: response.status,
        });
        break;
      }

      const data = (await response.json()) as PlacesResponse;

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        logger.error("[prospect-finder] Google Places API status", {
          status: data.status,
        });
        break;
      }

      for (const place of data.results) {
        // Filter by review count
        const reviewCount = place.user_ratings_total ?? 0;
        if (reviewCount < MIN_REVIEWS || reviewCount > MAX_REVIEWS) {
          continue;
        }

        // Skip non-operational businesses
        if (
          place.business_status &&
          place.business_status !== "OPERATIONAL"
        ) {
          continue;
        }

        const painSignals: ProspectInput["painSignals"] = [];

        // Low rating = pain signal for reputation management
        if (place.rating && place.rating < 4.0) {
          painSignals.push({
            type: "low_rating",
            evidence: `Google rating: ${place.rating}/5 with ${reviewCount} reviews`,
            score: Math.round((4.0 - place.rating) * 5),
          });
        }

        // Few reviews relative to competitors = visibility pain
        if (reviewCount < 30) {
          painSignals.push({
            type: "low_visibility",
            evidence: `Only ${reviewCount} Google reviews`,
            score: 5,
          });
        }

        // No website = major tech gap
        if (!place.website) {
          painSignals.push({
            type: "no_website",
            evidence: "No website listed on Google Business Profile",
            score: 8,
          });
        }

        prospects.push({
          businessName: place.name,
          phone: place.formatted_phone_number,
          website: place.website,
          vertical: params.vertical,
          city: params.city,
          state: params.state,
          reviewCount,
          painSignals,
        });

        if (prospects.length >= MAX_RESULTS) break;
      }

      nextPageToken = data.next_page_token;
      if (!nextPageToken) break;

      // Google requires a short delay before using the next page token
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      logger.errorWithCause("[prospect-finder] Failed to fetch places", err);
      break;
    }
  }

  logger.info("[prospect-finder] Scrape complete", {
    resultsFound: prospects.length,
  });

  return prospects;
}
