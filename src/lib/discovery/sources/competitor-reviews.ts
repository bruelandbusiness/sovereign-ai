import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { CompetitorReviewConfig, RawDiscoveredLead } from "../types";

const AI_MODEL =
  process.env.CLAUDE_DISCOVERY_MODEL || "claude-haiku-4-5-20251001";

// AGENTS.md: delivery.discovery.reviews system prompt
const REVIEW_ANALYSIS_PROMPT = `You are analyzing a Google review left on a home services contractor's business page. Your job is to determine if the reviewer is a potential lead for a competing contractor.

A good lead signal is:
- The reviewer needed a specific service (HVAC repair, roof replacement, etc.)
- They had a bad experience (no-show, overcharged, poor quality, slow response)
- They seem like a homeowner (not a business, not a troll)
- The review is recent (last 6 months)

Analyze the review and return ONLY valid JSON (no markdown):
{
  "is_lead_signal": true/false,
  "service_needed": "specific service mentioned",
  "pain_point": "what went wrong",
  "urgency": "high/medium/low",
  "homeowner_confidence": "high/medium/low",
  "reasoning": "one sentence"
}`;

interface ReviewAnalysis {
  is_lead_signal: boolean;
  service_needed: string;
  pain_point: string;
  urgency: "high" | "medium" | "low";
  homeowner_confidence: "high" | "medium" | "low";
  reasoning: string;
}

/** AGENTS.md limits */
const MAX_REVIEWS_PER_COMPETITOR = 100;
const MAX_COMPETITORS_PER_RUN = 5;

const GOOGLE_PLACES_SEARCH_URL =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";
const GOOGLE_PLACE_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";

/**
 * Mine negative reviews of competitors to discover leads with unmet service needs.
 *
 * Uses the Google Places API to find competitors by name and location,
 * then extracts 1-3 star reviews mentioning service issues.
 *
 * Each qualifying review becomes a RawDiscoveredLead with review metadata.
 */
export async function fetchCompetitorNegativeReviews(
  config: CompetitorReviewConfig,
): Promise<RawDiscoveredLead[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    logger.warn(
      "[discovery:competitor-reviews] GOOGLE_PLACES_API_KEY not set, skipping competitor review fetch",
      { competitors: config.competitorNames },
    );
    return [];
  }

  const minRating = config.minRating ?? 1;
  const maxRating = config.maxRating ?? 3;
  const leads: RawDiscoveredLead[] = [];

  // AGENTS.md: Never scrape more than 5 competitors per client per run
  const competitors = config.competitorNames.slice(0, MAX_COMPETITORS_PER_RUN);

  for (const competitorName of competitors) {
    try {
      const placeId = await findPlaceId(
        apiKey,
        competitorName,
        config.city,
        config.state,
        config.vertical,
      );

      if (!placeId) {
        logger.info("[discovery:competitor-reviews] No place found for competitor", {
          competitorName,
          city: config.city,
        });
        continue;
      }

      const reviews = await fetchPlaceReviews(apiKey, placeId);

      // AGENTS.md: Max 100 reviews analyzed per competitor per run
      let analyzedCount = 0;

      for (const review of reviews) {
        if (analyzedCount >= MAX_REVIEWS_PER_COMPETITOR) break;

        const rating = typeof review.rating === "number" ? review.rating : 0;

        // AGENTS.md: Only analyze 1-3 star reviews (4-5 = satisfied, not a lead)
        if (rating < minRating || rating > maxRating) continue;

        const text = String(review.text || "");
        if (!text || text.length < 20) continue;

        analyzedCount++;

        // Use Claude (haiku for speed) to classify each review
        const analysis = await analyzeReview(text, config.vertical);

        const authorName = String(review.author_name || "Reviewer");
        const externalId = `google-review:${placeId}:${authorName}:${rating}`;

        // AGENTS.md: Only create lead if is_lead_signal AND homeowner_confidence high
        if (analysis && analysis.is_lead_signal && analysis.homeowner_confidence === "high") {
          leads.push({
            externalId,
            sourceType: "competitor_review",
            reviewPlatform: "google",
            reviewRating: rating,
            reviewSnippet: text.length > 500 ? text.slice(0, 500) : text,
            competitorName,
            rawData: {
              placeId,
              authorName: review.author_name,
              rating: review.rating,
              relativeTimeDescription: review.relative_time_description,
              text: review.text,
              analysis,
            },
          });
        }
      }
    } catch (err) {
      logger.errorWithCause(
        "[discovery:competitor-reviews] Failed to process competitor",
        err,
        { competitorName },
      );
    }
  }

  logger.info("[discovery:competitor-reviews] Completed review mining", {
    competitorCount: config.competitorNames.length,
    leadsFound: leads.length,
  });

  return leads;
}

async function findPlaceId(
  apiKey: string,
  businessName: string,
  city: string,
  state: string,
  vertical: string,
): Promise<string | null> {
  const query = `${businessName} ${vertical} ${city} ${state}`;
  const params = new URLSearchParams({
    query,
    key: apiKey,
  });

  const url = `${GOOGLE_PLACES_SEARCH_URL}?${params.toString()}`;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    logger.warn("[discovery:competitor-reviews] Places search failed", {
      status: response.status,
      businessName,
    });
    return null;
  }

  const data = (await response.json()) as {
    results?: Array<{ place_id: string }>;
  };

  return data.results?.[0]?.place_id ?? null;
}

async function fetchPlaceReviews(
  apiKey: string,
  placeId: string,
): Promise<Array<PlaceReview>> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "reviews",
    key: apiKey,
  });

  const url = `${GOOGLE_PLACE_DETAILS_URL}?${params.toString()}`;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    logger.warn("[discovery:competitor-reviews] Place details request failed", {
      status: response.status,
      placeId,
    });
    return [];
  }

  const data = (await response.json()) as {
    result?: { reviews?: PlaceReview[] };
  };

  return data.result?.reviews ?? [];
}

interface PlaceReview {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
}

/**
 * Use Claude Haiku to analyze a review for lead signals.
 * AGENTS.md: delivery.discovery.reviews agent.
 */
async function analyzeReview(
  reviewText: string,
  vertical: string
): Promise<ReviewAnalysis | null> {
  try {
    const response = await guardedAnthropicCall({
      clientId: "__system__",
      action: "discovery.review_analysis",
      description: `Analyze competitor review for ${vertical} lead signals`,
      params: {
        model: AI_MODEL,
        max_tokens: 256,
        system: REVIEW_ANALYSIS_PROMPT,
        messages: [
          {
            role: "user",
            content: `Vertical: ${vertical}\n\nReview text:\n"""${reviewText.slice(0, 1000)}"""`,
          },
        ],
      },
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return JSON.parse(text) as ReviewAnalysis;
  } catch (err) {
    logger.errorWithCause(
      "[discovery:competitor-reviews] Claude review analysis failed",
      err
    );
    return null;
  }
}
