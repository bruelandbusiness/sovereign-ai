// Reputation / brand monitoring integration
// Google Places API + Yelp + Claude AI response generation
// Returns mock data when API keys are not set

import { createHash } from "crypto";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { logger } from "@/lib/logger";
import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import {
  fetchWithRetry,
} from "@/lib/integrations/integration-utils";

/**
 * Generate a stable, deterministic review ID from review content.
 * This ensures dedup works even if the external API reorders reviews.
 */
function stableReviewId(platform: string, author: string, text: string, timestamp: number | string): string {
  const hash = createHash("sha256")
    .update(`${platform}:${author}:${text}:${timestamp}`)
    .digest("hex")
    .substring(0, 16);
  return `${platform}-${hash}`;
}

// ── Types ────────────────────────────────────────────────────

export interface Review {
  id: string;
  platform: "google" | "yelp";
  author: string;
  rating: number;
  text: string;
  date: string;
  responseText?: string;
  respondedAt?: string;
}

export interface ReputationScore {
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  sentimentScore: number; // 0-100
  breakdown: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

// ── Config ───────────────────────────────────────────────────

const TAG = "reputation";

// Read env lazily (not at module load) so runtime changes are picked up
function getGooglePlacesKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY;
}
function getYelpKey(): string | undefined {
  return process.env.YELP_API_KEY;
}

const RETRY_OPTS_GOOGLE = { integration: `${TAG}-google` };
const RETRY_OPTS_YELP = { integration: `${TAG}-yelp` };

// ── Mock Data ────────────────────────────────────────────────

/**
 * Generate deterministic mock reviews for development/testing.
 * Uses fixed data so that:
 * - Reputation scores are stable across requests
 * - Cron dedup logic can correctly match previously-seen reviews
 * - Review IDs are consistent (no random or time-based components)
 */
function generateMockReviews(platform: "google" | "yelp"): Review[] {
  const mockData: Array<{ name: string; rating: number; text: string; daysAgo: number }> = [
    { name: "John S.", rating: 5, text: "Excellent service! They were professional and finished on time.", daysAgo: 5 },
    { name: "Maria G.", rating: 5, text: "Very happy with the work. Would recommend to anyone in the area.", daysAgo: 12 },
    { name: "David P.", rating: 4, text: "Great communication throughout the project. Fair pricing too.", daysAgo: 20 },
    { name: "Sarah L.", rating: 4, text: "These guys are the best in town. Been using them for years.", daysAgo: 35 },
    { name: "Mike R.", rating: 3, text: "Took longer than expected but the end result was good.", daysAgo: 50 },
    { name: "Jennifer K.", rating: 2, text: "Average experience. Nothing special but got the job done.", daysAgo: 65 },
  ];

  // Use a fixed reference date so daysAgo produces stable dates.
  // In production, real API data is used instead.
  const referenceDate = new Date("2025-06-01T00:00:00Z");

  return mockData.map((entry, i) => {
    const date = new Date(referenceDate.getTime() - entry.daysAgo * 24 * 60 * 60 * 1000);
    return {
      id: `mock-${platform}-${i}`,
      platform,
      author: entry.name,
      rating: entry.rating,
      text: entry.text,
      date: date.toISOString(),
    };
  });
}

// ── Google Reviews ───────────────────────────────────────────

export async function checkGoogleReviews(placeId: string): Promise<Review[]> {
  const apiKey = getGooglePlacesKey();
  if (!apiKey) {
    logger.warn(`[${TAG}] GOOGLE_PLACES_API_KEY not set — returning mock data`);
    return generateMockReviews("google");
  }

  try {
    // Pass API key via query param as required by Google Places API.
    // fetchWithRetry handles retry on transient errors (429, 5xx, timeout).
    const response = await fetchWithRetry(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=reviews&key=${apiKey}`,
      undefined,
      undefined,
      RETRY_OPTS_GOOGLE,
    );

    const data = (await response.json()) as {
      result?: {
        reviews?: Array<{
          author_name: string;
          rating: number;
          text: string;
          time: number;
        }>;
      };
    };

    const reviews = data.result?.reviews || [];
    return reviews.map((r) => ({
      id: stableReviewId("google", r.author_name, r.text, r.time),
      platform: "google" as const,
      author: r.author_name || "Anonymous",
      rating: typeof r.rating === "number" ? r.rating : 0,
      text: r.text || "",
      date: new Date((r.time || 0) * 1000).toISOString(),
    }));
  } catch (err) {
    logger.error(`[${TAG}] Google reviews fetch failed`, {
      error: err instanceof Error ? err.message : String(err),
    });
    // In production, propagate the error instead of silently returning mock data.
    // Returning mocks when the API is down would corrupt reputation scores and
    // cause the cron job to generate phantom review responses.
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    return generateMockReviews("google");
  }
}

// ── Yelp Reviews ─────────────────────────────────────────────

export async function checkYelpReviews(businessId: string): Promise<Review[]> {
  const apiKey = getYelpKey();
  if (!apiKey) {
    logger.warn(`[${TAG}] YELP_API_KEY not set — returning mock data`);
    return generateMockReviews("yelp");
  }

  try {
    const response = await fetchWithRetry(
      `https://api.yelp.com/v3/businesses/${encodeURIComponent(businessId)}/reviews?sort_by=yelp_sort`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      undefined,
      RETRY_OPTS_YELP,
    );

    const data = (await response.json()) as {
      reviews?: Array<{
        id: string;
        user: { name: string };
        rating: number;
        text: string;
        time_created: string;
      }>;
    };

    const reviews = data.reviews || [];
    return reviews.map((r) => ({
      id: `yelp-${r.id}`,
      platform: "yelp" as const,
      author: r.user?.name || "Anonymous",
      rating: typeof r.rating === "number" ? r.rating : 0,
      text: r.text || "",
      date: new Date(r.time_created).toISOString(),
    }));
  } catch (err) {
    logger.error(`[${TAG}] Yelp reviews fetch failed`, {
      error: err instanceof Error ? err.message : String(err),
    });
    // In production, propagate the error instead of silently returning mock data.
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    return generateMockReviews("yelp");
  }
}

// ── AI Review Response Generation ────────────────────────────

export async function generateReviewResponse(
  review: Review,
  businessName: string,
  clientId?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const templateFallback = () => {
    if (review.rating >= 4) {
      return `Thank you so much for your wonderful ${review.rating}-star review, ${review.author}! We're thrilled to hear about your positive experience with ${businessName}. Your kind words mean a lot to our team. We look forward to serving you again!`;
    }
    return `Thank you for taking the time to share your feedback, ${review.author}. We're sorry to hear that your experience with ${businessName} didn't meet expectations. We take all feedback seriously and would love the opportunity to make things right. Please reach out to us directly so we can address your concerns.`;
  };

  if (!apiKey || !clientId) {
    logger.warn(`[${TAG}] ANTHROPIC_API_KEY or clientId not set — returning template response`);
    return templateFallback();
  }

  try {
    const message = await guardedAnthropicCall({
      clientId,
      action: "review.respond",
      description: `Generate response to ${review.rating}-star review from ${review.author}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `You are a reputation management assistant for "${sanitizeForPrompt(businessName, 200)}". Write a professional, warm, and personalized response to this ${review.rating}-star review from ${sanitizeForPrompt(review.author, 100)}:

"${sanitizeForPrompt(review.text, 2000)}"

Guidelines:
- Be genuine and grateful
- Address specific points from the review
- If negative (1-3 stars), apologize and offer to resolve
- If positive (4-5 stars), thank them warmly
- Keep it under 100 words
- Don't be generic — reference details from their review
- Sign off as "The ${sanitizeForPrompt(businessName, 200)} Team"`,
          },
        ],
      },
    });

    return extractTextContent(message, "Thank you for your review!");
  } catch (err) {
    if (err instanceof GovernanceBlockedError) {
      logger.warn(`[${TAG}] Governance blocked for client ${clientId}: ${err.reason}`);
      return templateFallback();
    }
    throw err;
  }
}

// ── Reputation Score Calculation ─────────────────────────────

export function getReputationScore(reviews: Review[]): ReputationScore {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      responseRate: 0,
      sentimentScore: 0,
      breakdown: {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
    };
  }

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;

  const responded = reviews.filter((r) => r.responseText).length;
  const responseRate = reviews.length > 0 ? (responded / reviews.length) * 100 : 0;

  // Simple sentiment score: weighted by rating distribution
  const sentimentScore = Math.round(((averageRating - 1) / 4) * 100);

  const breakdown = {
    fiveStar: reviews.filter((r) => r.rating === 5).length,
    fourStar: reviews.filter((r) => r.rating === 4).length,
    threeStar: reviews.filter((r) => r.rating === 3).length,
    twoStar: reviews.filter((r) => r.rating === 2).length,
    oneStar: reviews.filter((r) => r.rating === 1).length,
  };

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
    responseRate: Math.round(responseRate),
    sentimentScore,
    breakdown,
  };
}
