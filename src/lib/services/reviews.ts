import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractTextContent,
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Review {
  platform: string; // "google" | "yelp" | "facebook"
  reviewerName: string;
  rating: number; // 1-5
  reviewText: string;
}

export interface ReviewResponseResult {
  responseText: string;
  tone: "grateful" | "empathetic" | "professional";
  reviewResponseId: string;
}

export interface ReviewRequestResult {
  subject: string;
  message: string;
  campaignId: string;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the review automation service for a client.
 * Creates an initial "getting started" activity event.
 */
export async function provisionReviews(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Idempotency: skip if already provisioned
  const existing = await prisma.activityEvent.findFirst({
    where: { clientId, title: "Review automation activated" },
  });
  if (existing) return;

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "review_received",
      title: "Review automation activated",
      description: `Review request campaigns are ready for ${client.businessName}. Add your customers to start collecting 5-star reviews.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateReviewResponse — AI-powered review reply generation
// ---------------------------------------------------------------------------

/**
 * Generate a professional, on-brand response to a customer review.
 *
 * - Positive reviews (4-5 stars): grateful tone, mentions specific service,
 *   invites them back
 * - Neutral reviews (3 stars): professional tone, acknowledges feedback,
 *   offers to improve
 * - Negative reviews (1-2 stars): empathetic tone, apologizes, offers to
 *   resolve offline with direct contact
 *
 * Stores the generated response as a draft ReviewResponse record.
 */
export async function generateReviewResponse(
  clientId: string,
  review: Review
): Promise<ReviewResponseResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeReviewerName = sanitizeForPrompt(review.reviewerName, 100);
  const safeReviewText = sanitizeForPrompt(review.reviewText, 2000);
  const safePlatform = sanitizeForPrompt(review.platform, 50);
  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const vertical = client.vertical || "home service";

  const tone: ReviewResponseResult["tone"] =
    review.rating >= 4
      ? "grateful"
      : review.rating === 3
        ? "professional"
        : "empathetic";

  let toneInstructions: string;
  if (review.rating >= 4) {
    toneInstructions = `This is a POSITIVE review. Respond with warmth and gratitude:
- Thank the reviewer by name
- Reference something specific they mentioned about the service
- Express how much their feedback means to the team
- Invite them to use your services again
- Keep it genuine — not generic or robotic`;
  } else if (review.rating === 3) {
    toneInstructions = `This is a NEUTRAL review. Respond professionally:
- Thank them for the honest feedback
- Acknowledge what went well and what could improve
- Show you take their feedback seriously
- Offer to make it right if they have concerns
- Invite them to reach out directly`;
  } else {
    toneInstructions = `This is a NEGATIVE review. Respond with empathy and professionalism:
- Sincerely apologize for their poor experience
- Do NOT be defensive or make excuses
- Acknowledge their specific complaints
- Offer to resolve the issue offline: "We'd love to make this right. Please contact us at [phone/email] so we can address this personally."
- Sign off with the owner's name to show personal accountability
- Keep it concise — long responses to negative reviews look defensive`;
  }

  const systemPrompt = `You are a reputation management expert helping ${safeBusinessName}, a ${vertical} company, respond to online reviews. Write responses that sound like they come from ${safeOwnerName}, the business owner — not a marketing agency or AI.`;

  const userPrompt = `Write a response to this ${safePlatform} review:

Reviewer: ${safeReviewerName}
Rating: ${review.rating}/5 stars
Review: "${safeReviewText}"

${toneInstructions}

Important:
- Keep the response under 150 words
- Do not use excessive exclamation marks
- Sound human, not corporate
- Do not include the rating or platform name in your response
- Sign the response as "${safeOwnerName}, ${safeBusinessName}"

Return ONLY the review response text, nothing else.`;

  let responseText: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "reviews.response",
      description: `Generate ${tone} response to ${review.rating}-star ${safePlatform} review`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    responseText = extractTextContent(response, "");
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error; // Let caller handle governance blocks
    }
    logger.errorWithCause("[reviews] AI call failed:", error);
    // Graceful fallback responses
    responseText = generateFallbackReviewResponse(
      review,
      client.businessName,
      client.ownerName
    );
  }

  if (!responseText) {
    responseText = generateFallbackReviewResponse(
      review,
      client.businessName,
      client.ownerName
    );
  }

  // Store as a draft review response
  const reviewResponse = await prisma.reviewResponse.create({
    data: {
      clientId,
      platform: review.platform,
      reviewerName: review.reviewerName,
      rating: review.rating,
      reviewText: review.reviewText,
      responseText,
      status: "draft",
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "review_received",
      title: `AI response drafted for ${review.rating}-star ${review.platform} review`,
      description: `Response to ${review.reviewerName}'s review is ready for your approval.`,
    },
  });

  return {
    responseText,
    tone,
    reviewResponseId: reviewResponse.id,
  };
}

// ---------------------------------------------------------------------------
// generateReviewRequest — personalized review solicitation
// ---------------------------------------------------------------------------

/**
 * Generate a personalized SMS or email message asking a customer to leave
 * a review after completing a service.
 *
 * Creates a ReviewCampaign record in "pending" status ready to be sent.
 */
export async function generateReviewRequest(
  clientId: string,
  customerName: string,
  serviceCompleted: string,
  customerEmail: string,
  customerPhone?: string
): Promise<ReviewRequestResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeCustomerName = sanitizeForPrompt(customerName, 100);
  const safeService = sanitizeForPrompt(serviceCompleted, 200);
  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const vertical = client.vertical || "home service";
  const location =
    client.city && client.state
      ? `${client.city}, ${client.state}`
      : "your area";

  const systemPrompt = `You are a customer communication expert for ${safeBusinessName}, a ${vertical} company in ${location}. Write messages that feel personal and genuine, not like mass marketing.`;

  const userPrompt = `Write a review request message for a customer who just had service completed.

Customer name: ${safeCustomerName}
Service completed: ${safeService}
Business: ${safeBusinessName}

Requirements:
- Start by thanking them personally for choosing ${safeBusinessName}
- Reference the specific service they received
- Politely ask them to share their experience with a review
- Keep it warm and brief (under 100 words for SMS, under 150 words for email)
- Do NOT be pushy or offer incentives for reviews (this violates review platform policies)
- Include a natural call-to-action like "It would mean the world to us if you could share your experience"

Return a JSON object with:
- "subject": email subject line (short and personal, not salesy)
- "message": the review request message body (plain text, suitable for both email and SMS)`;

  let subject: string;
  let message: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "reviews.request",
      description: `Generate review request for ${safeCustomerName} after ${safeService}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{ subject?: string; message?: string }>(
      response,
      {}
    );

    subject =
      parsed.subject ||
      `Thank you for choosing ${client.businessName}, ${customerName}!`;
    message =
      parsed.message ||
      extractTextContent(response, "") ||
      generateFallbackReviewRequest(
        customerName,
        serviceCompleted,
        client.businessName
      );
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[reviews] AI review request generation failed:", error);
    subject = `Thank you for choosing ${client.businessName}, ${customerName}!`;
    message = generateFallbackReviewRequest(
      customerName,
      serviceCompleted,
      client.businessName
    );
  }

  // Create a ReviewCampaign record
  const campaign = await prisma.reviewCampaign.create({
    data: {
      clientId,
      name: `Review request: ${customerName} - ${serviceCompleted}`,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      status: "pending",
    },
  });

  return {
    subject,
    message,
    campaignId: campaign.id,
  };
}

// ---------------------------------------------------------------------------
// Fallback generators (no AI required)
// ---------------------------------------------------------------------------

function generateFallbackReviewResponse(
  review: Review,
  businessName: string,
  ownerName: string
): string {
  if (review.rating >= 4) {
    return `Thank you so much for your kind words, ${review.reviewerName}! We're thrilled to hear about your experience. Your feedback motivates our entire team to keep delivering the best service possible. We look forward to helping you again!\n\n- ${ownerName}, ${businessName}`;
  }
  if (review.rating === 3) {
    return `Thank you for your feedback, ${review.reviewerName}. We appreciate you taking the time to share your experience. We're always looking to improve, and your input helps us do that. If there's anything we can do to earn a 5-star experience next time, please don't hesitate to reach out.\n\n- ${ownerName}, ${businessName}`;
  }
  return `${review.reviewerName}, we sincerely apologize for your experience. This is not the standard we hold ourselves to, and we want to make this right. Please reach out to us directly so we can address your concerns personally. Your satisfaction is our top priority.\n\n- ${ownerName}, ${businessName}`;
}

function generateFallbackReviewRequest(
  customerName: string,
  serviceCompleted: string,
  businessName: string
): string {
  return `Hi ${customerName},\n\nThank you for choosing ${businessName} for your ${serviceCompleted}! We hope everything exceeded your expectations.\n\nIf you have a moment, we'd really appreciate it if you could share your experience with a quick review. It helps other homeowners find reliable service and means the world to our team.\n\nThank you for your support!\n\n- The ${businessName} Team`;
}
