// AI Review Response Generator
// Uses Claude to generate professional, on-brand review responses
// Falls back to template responses when ANTHROPIC_API_KEY is not set

import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

export interface ReviewInput {
  rating: number;
  reviewerName: string;
  reviewText: string;
  businessName: string;
  vertical?: string;
  /** Client ID for governance budget tracking. Falls back to template if omitted. */
  clientId?: string;
}

/**
 * Generate a professional, on-brand response to a customer review.
 * - Positive reviews (4-5 stars): Thank them, reference specifics, invite them back
 * - Neutral reviews (3 stars): Acknowledge, address concerns, offer to make it right
 * - Negative reviews (1-2 stars): Empathize, apologize, offer resolution, take offline
 */
export async function generateReviewResponse(
  review: ReviewInput
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[ai-review-response] ANTHROPIC_API_KEY not set — returning template response");
    return getTemplateResponse(review);
  }

  if (!review.clientId) {
    console.warn("[ai-review-response] No clientId provided — returning template response");
    return getTemplateResponse(review);
  }

  const toneGuidance = getToneGuidance(review.rating);
  const verticalContext = review.vertical
    ? `The business is in the ${review.vertical} industry.`
    : "";

  try {
    const message = await guardedAnthropicCall({
      clientId: review.clientId,
      action: "review.respond",
      description: `Generate response to ${review.rating}-star review from ${review.reviewerName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `You are a reputation management expert writing a response on behalf of "${sanitizeForPrompt(review.businessName, 200)}". ${verticalContext}

Write a professional, warm, and personalized response to this ${review.rating}-star review from ${sanitizeForPrompt(review.reviewerName, 100)}:

"${sanitizeForPrompt(review.reviewText, 2000)}"

${toneGuidance}

Important guidelines:
- Be genuine and specific — reference details from their review
- Keep it under 120 words
- Do NOT use generic phrases like "We value your feedback"
- Sign off as "The ${sanitizeForPrompt(review.businessName, 200)} Team"
- Match a professional but friendly tone
- Do not use emojis`,
          },
        ],
      },
    });

    return extractTextContent(message, getTemplateResponse(review));
  } catch (err) {
    if (err instanceof GovernanceBlockedError) {
      console.warn(`[ai-review-response] Governance blocked for client ${review.clientId}: ${err.reason}`);
      return getTemplateResponse(review);
    }
    // Fall back to template on any AI error (rate limit, timeout, etc.)
    // to prevent a single API failure from breaking the entire review response flow.
    console.error(`[ai-review-response] AI call failed for client ${review.clientId}, falling back to template:`, err instanceof Error ? err.message : err);
    return getTemplateResponse(review);
  }
}

function getToneGuidance(rating: number): string {
  if (rating >= 4) {
    return `This is a positive review. Your response should:
- Express genuine gratitude
- Reference something specific they mentioned
- Invite them to come back or recommend you to others
- Keep the energy upbeat and warm`;
  }
  if (rating === 3) {
    return `This is a neutral review. Your response should:
- Thank them for taking the time to share their experience
- Acknowledge what went well
- Address any concerns they raised
- Offer to make their next experience better
- Provide a way for them to reach out directly`;
  }
  return `This is a negative review. Your response should:
- Express empathy and take their concerns seriously
- Apologize for their experience without making excuses
- Briefly mention your commitment to quality
- Offer a specific resolution or invite them to contact you directly
- Take the conversation offline — provide a phone number or email placeholder
- Remain professional and avoid being defensive`;
}

function getTemplateResponse(review: ReviewInput): string {
  if (review.rating >= 4) {
    return `Thank you so much for your wonderful ${review.rating}-star review, ${review.reviewerName}! We're thrilled to hear about your positive experience with ${review.businessName}. Your kind words mean a lot to our team, and we truly appreciate you taking the time to share. We look forward to serving you again soon!\n\n— The ${review.businessName} Team`;
  }
  if (review.rating === 3) {
    return `Thank you for sharing your experience, ${review.reviewerName}. We appreciate your honest feedback about ${review.businessName}. We're glad to hear what went well, and we take your suggestions seriously. We'd love the chance to exceed your expectations next time. Please don't hesitate to reach out to us directly.\n\n— The ${review.businessName} Team`;
  }
  return `Thank you for taking the time to share your feedback, ${review.reviewerName}. We sincerely apologize that your experience with ${review.businessName} didn't meet the standards we strive for. We take your concerns very seriously and would like the opportunity to make things right. Please reach out to us directly so we can address this personally.\n\n— The ${review.businessName} Team`;
}
