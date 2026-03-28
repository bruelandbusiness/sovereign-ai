/**
 * Prospect Scorer
 *
 * Scores each prospect 0-100 based on signals that indicate they are a
 * good fit for Sovereign AI's services.  Higher score = more likely to
 * need marketing help and be reachable.
 *
 * Scoring breakdown:
 *   - Review count < 50            → +20  (they need marketing help)
 *   - Rating < 4.5                 → +15  (reputation issues)
 *   - No website                   → +25  (huge opportunity)
 *   - Website but no chat widget   → +10  (missing lead capture)
 *   - Small business indicators    → +15  (ideal customer profile)
 *   - Has email found              → +15  (can actually reach them)
 *                            Max total: 100
 */

import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { ScoreBreakdown } from "./types";

const TAG = "[prospect-scorer]";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScoreInput {
  reviewCount: number | null;
  rating: number | null;
  website: string | null;
  email: string | null;
  employeeCount: number | null;
}

/**
 * Score a prospect synchronously based on available data fields.
 *
 * If website chat-widget detection is needed, call `scoreProspectAsync`
 * instead (it fetches the site to check for chat widgets).
 */
export function scoreProspect(input: ScoreInput): ScoreBreakdown {
  let reviewCountScore = 0;
  let ratingScore = 0;
  let noWebsiteScore = 0;
  const noChatWidgetScore = 0;
  let smallBusinessScore = 0;
  let hasEmailScore = 0;

  // Review count < 50 → +20
  if (input.reviewCount === null || input.reviewCount < 50) {
    reviewCountScore = 20;
  }

  // Rating < 4.5 → +15
  if (input.rating !== null && input.rating < 4.5) {
    ratingScore = 15;
  }

  // No website → +25
  if (!input.website) {
    noWebsiteScore = 25;
  }

  // Small business indicators → +15
  // No employee count = assume small, or count <= 50
  if (input.employeeCount === null || input.employeeCount <= 50) {
    smallBusinessScore = 15;
  }

  // Has email → +15
  if (input.email) {
    hasEmailScore = 15;
  }

  const total = Math.min(
    100,
    reviewCountScore +
      ratingScore +
      noWebsiteScore +
      noChatWidgetScore +
      smallBusinessScore +
      hasEmailScore,
  );

  return {
    reviewCountScore,
    ratingScore,
    noWebsiteScore,
    noChatWidgetScore,
    smallBusinessScore,
    hasEmailScore,
    total,
  };
}

/**
 * Score a prospect with async website analysis (checks for chat widgets).
 *
 * Falls back to the synchronous scorer if the website fetch fails.
 */
export async function scoreProspectAsync(
  input: ScoreInput,
): Promise<ScoreBreakdown> {
  const base = scoreProspect(input);

  // If there IS a website, check for chat widget absence
  if (input.website && base.noWebsiteScore === 0) {
    const hasChatWidget = await detectChatWidget(input.website);
    if (!hasChatWidget) {
      base.noChatWidgetScore = 10;
      base.total = Math.min(100, base.total + 10);
    }
  }

  return base;
}

// ---------------------------------------------------------------------------
// Chat widget detection
// ---------------------------------------------------------------------------

/** Common chat widget markers in page HTML. */
const CHAT_WIDGET_SIGNATURES = [
  "intercom",
  "drift",
  "livechat",
  "tawk.to",
  "zendesk",
  "crisp.chat",
  "tidio",
  "hubspot",
  "freshchat",
  "olark",
  "liveperson",
  "chat-widget",
  "chatWidget",
  "chat-button",
  "chatbot",
  "webchat",
];

/**
 * Fetch a website and check if it contains known chat widget scripts/markers.
 * Returns `true` if a chat widget is likely present.
 */
async function detectChatWidget(websiteUrl: string): Promise<boolean> {
  try {
    let url = websiteUrl;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SovereignAI/1.0; +https://trysovereignai.com)",
          Accept: "text/html",
        },
      },
      8_000,
    );

    if (!response.ok) return false;

    const html = await response.text();
    const lowerHtml = html.toLowerCase();

    return CHAT_WIDGET_SIGNATURES.some((sig) => lowerHtml.includes(sig));
  } catch (err) {
    logger.warn(`${TAG} Chat widget detection failed for ${websiteUrl}`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
