/**
 * Review Engine — Automated review request flow and review monitoring.
 *
 * Handles the full lifecycle of Google review acquisition:
 * 1. Post-job review request sequences (SMS + email)
 * 2. Review classification and auto-response drafting
 * 3. Review alerting (Telegram, SMS, email)
 * 4. Competitive review monitoring
 *
 * No external dependencies.
 */

// ─── Review Request Flow ─────────────────────────────────────

export interface ReviewRequestConfig {
  /** Google review link, e.g. https://search.google.com/local/writereview?placeid={place_id} */
  googleReviewLink: string;
  contractorName: string;
  contractorPhone: string;
}

export interface CompletedJob {
  customerFirstName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceType: string;
  completedAt: Date;
  /** If the customer had a complaint, flag for contractor to handle personally first. */
  hadComplaint: boolean;
  /** Customer opted out of review requests. */
  optedOut: boolean;
}

export type ReviewRequestStep = "sms_24h" | "email_48h" | "sms_followup_5d";

export interface ReviewRequest {
  step: ReviewRequestStep;
  channel: "sms" | "email";
  delayHours: number;
  sendAt: Date;
  content: string;
  /** Email only */
  subject?: string;
}

// ─── Review Monitoring ───────────────────────────────────────

export type ReviewSentiment = "positive" | "neutral" | "negative";

export interface ReviewAlert {
  reviewerName: string;
  rating: number;
  text: string;
  sentiment: ReviewSentiment;
  alertLevel: "info" | "warning" | "critical";
  channels: ("sms" | "email" | "telegram")[];
  suggestedResponse: string;
}

export interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
  /** Reviews per month (trailing 3 months). */
  reviewVelocity: number;
  /** Percentage of reviews that received a response. */
  responseRate: number;
  /** Average hours to respond to a review. */
  avgResponseTimeHours: number;
  sentimentTrend: { positive: number; neutral: number; negative: number };
}

// ─── Competitive Monitoring ──────────────────────────────────

export interface CompetitorReviewStatus {
  competitorName: string;
  totalReviews: number;
  averageRating: number;
  clientTotalReviews: number;
  clientAverageRating: number;
  clientAhead: boolean;
  /** Review count gap (positive = client ahead, negative = behind). */
  gap: number;
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS in generated email content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Add a number of hours to a date, returning a new Date.
 */
function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

// ─── Review Request Functions ────────────────────────────────

/**
 * Build the standard Google review link from a Place ID.
 *
 * @param placeId - The Google Place ID for the business.
 * @returns The full URL customers can click to leave a review.
 */
export function buildGoogleReviewLink(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/**
 * Generate the SMS text for the 24-hour or 5-day follow-up review request.
 *
 * @param step - Which SMS step in the sequence.
 * @param firstName - Customer's first name.
 * @param contractorName - The contractor/business name.
 * @param reviewLink - The Google review link.
 * @returns The SMS body text.
 */
export function generateReviewSms(
  step: "sms_24h" | "sms_followup_5d",
  firstName: string,
  contractorName: string,
  reviewLink: string
): string {
  if (step === "sms_24h") {
    return (
      `Hi ${firstName}! Thank you for choosing ${contractorName}. ` +
      `We hope you're happy with the work. Would you mind leaving us a quick Google review? ` +
      `It really helps our small business. ${reviewLink}`
    );
  }

  // sms_followup_5d
  return (
    `Hi ${firstName}, just a friendly follow-up from ${contractorName}. ` +
    `If you have a moment, we'd truly appreciate a Google review: ${reviewLink} ` +
    `Thank you!`
  );
}

/**
 * Generate the 48-hour email review request with HTML content.
 * All dynamic values are HTML-escaped to prevent XSS.
 *
 * @param firstName - Customer's first name.
 * @param contractorName - The contractor/business name.
 * @param serviceType - The type of service performed.
 * @param reviewLink - The Google review link.
 * @param phone - Contractor's phone number for questions.
 * @returns Object with subject and HTML body.
 */
export function generateReviewEmail(
  firstName: string,
  contractorName: string,
  serviceType: string,
  reviewLink: string,
  phone: string
): { subject: string; html: string } {
  const safeName = escapeHtml(firstName);
  const safeContractor = escapeHtml(contractorName);
  const safeService = escapeHtml(serviceType);
  const safeLink = escapeHtml(reviewLink);
  const safePhone = escapeHtml(phone);

  const subject = `How was your ${serviceType} experience with ${contractorName}?`;

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Hi ${safeName},</h2>
  <p>Thank you for choosing <strong>${safeContractor}</strong> for your recent <strong>${safeService}</strong> work.</p>
  <p>We take pride in every job and your feedback means the world to us. If you were happy with the service, would you mind taking a moment to share your experience?</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${safeLink}" style="display: inline-block; background-color: #4285F4; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: bold;">
      Leave a Google Review
    </a>
  </p>
  <p>It only takes a minute and helps other homeowners find reliable service.</p>
  <p>If anything wasn't perfect, please call us directly at <strong>${safePhone}</strong> so we can make it right.</p>
  <p>Thank you,<br/><strong>${safeContractor}</strong></p>
</div>`.trim();

  return { subject, html };
}

/**
 * Generate the full 3-step review request sequence for a completed job.
 *
 * Steps:
 * 1. SMS at 24 hours post-completion
 * 2. Email at 48 hours (if email available)
 * 3. SMS follow-up at 5 days
 *
 * Returns an empty array if:
 * - Customer opted out
 * - No phone AND no email available
 * - Customer had a complaint (contractor should handle personally first)
 *
 * @param job - The completed job details.
 * @param config - Review request configuration.
 * @returns Array of scheduled review requests.
 */
export function generateReviewRequests(
  job: CompletedJob,
  config: ReviewRequestConfig
): ReviewRequest[] {
  // Never send if opted out
  if (job.optedOut) {
    return [];
  }

  // If customer had a complaint, contractor should handle personally first
  if (job.hadComplaint) {
    return [];
  }

  // Need at least one contact method
  if (!job.customerPhone && !job.customerEmail) {
    return [];
  }

  const requests: ReviewRequest[] = [];

  // Step 1: SMS at 24 hours
  if (job.customerPhone) {
    requests.push({
      step: "sms_24h",
      channel: "sms",
      delayHours: 24,
      sendAt: addHours(job.completedAt, 24),
      content: generateReviewSms(
        "sms_24h",
        job.customerFirstName,
        config.contractorName,
        config.googleReviewLink
      ),
    });
  }

  // Step 2: Email at 48 hours
  if (job.customerEmail) {
    const email = generateReviewEmail(
      job.customerFirstName,
      config.contractorName,
      job.serviceType,
      config.googleReviewLink,
      config.contractorPhone
    );
    requests.push({
      step: "email_48h",
      channel: "email",
      delayHours: 48,
      sendAt: addHours(job.completedAt, 48),
      content: email.html,
      subject: email.subject,
    });
  }

  // Step 3: SMS follow-up at 5 days (120 hours)
  if (job.customerPhone) {
    requests.push({
      step: "sms_followup_5d",
      channel: "sms",
      delayHours: 120,
      sendAt: addHours(job.completedAt, 120),
      content: generateReviewSms(
        "sms_followup_5d",
        job.customerFirstName,
        config.contractorName,
        config.googleReviewLink
      ),
    });
  }

  return requests;
}

/**
 * Determine whether a review request should be sent for a given job.
 *
 * Enforces rules:
 * - Max 3 requests per customer
 * - Stop if review already received
 * - Stop if customer opted out
 * - Never incentivize reviews (this is an enforcement note; no incentive logic exists)
 * - Send to ALL completed jobs (no review gating / cherry-picking)
 *
 * @param job - The completed job.
 * @param requestsSent - Number of review requests already sent for this customer.
 * @param reviewReceived - Whether a review has already been received.
 * @param optedOut - Whether the customer has opted out.
 * @returns Object indicating whether to send, with a reason if not.
 */
export function shouldSendReviewRequest(
  job: CompletedJob,
  requestsSent: number,
  reviewReceived: boolean,
  optedOut: boolean
): { send: boolean; reason?: string } {
  if (optedOut || job.optedOut) {
    return { send: false, reason: "Customer opted out of review requests." };
  }

  if (reviewReceived) {
    return { send: false, reason: "Review already received from this customer." };
  }

  if (requestsSent >= 3) {
    return { send: false, reason: "Maximum of 3 review requests already sent." };
  }

  if (!job.customerPhone && !job.customerEmail) {
    return { send: false, reason: "No contact information available (no phone or email)." };
  }

  if (job.hadComplaint) {
    return {
      send: false,
      reason: "Customer had a complaint. Contractor should handle personally before requesting a review.",
    };
  }

  return { send: true };
}

// ─── Review Monitoring Functions ─────────────────────────────

/**
 * Classify a review by its star rating into sentiment and alert level.
 *
 * - 4-5 stars: positive / info
 * - 3 stars: neutral / warning
 * - 1-2 stars: negative / critical
 *
 * @param rating - The star rating (1-5).
 * @returns Sentiment and alert level.
 */
export function classifyReview(rating: number): {
  sentiment: ReviewSentiment;
  alertLevel: "info" | "warning" | "critical";
} {
  if (rating >= 4) {
    return { sentiment: "positive", alertLevel: "info" };
  }
  if (rating === 3) {
    return { sentiment: "neutral", alertLevel: "warning" };
  }
  return { sentiment: "negative", alertLevel: "critical" };
}

/**
 * Generate an auto-draft review response based on rating.
 *
 * - 4-5 star: Thank-you response mentioning the service.
 * - 3 star: Professional acknowledgment with offer to improve.
 * - 1-2 star: Empathetic apology with offer to discuss offline.
 *
 * @param rating - The star rating (1-5).
 * @param reviewerName - Name of the reviewer.
 * @param serviceInferred - The inferred service type from the review.
 * @param contractorName - Business name.
 * @param ownerName - Owner's name for the signature.
 * @param phone - Business phone for offline contact.
 * @returns The drafted response text.
 */
export function generateReviewResponse(
  rating: number,
  reviewerName: string,
  serviceInferred: string,
  contractorName: string,
  ownerName: string,
  phone: string
): string {
  if (rating >= 4) {
    return (
      `Thank you so much for the kind words, ${reviewerName}! ` +
      `We're thrilled that you're happy with your ${serviceInferred} experience. ` +
      `Our team at ${contractorName} takes pride in every job, and feedback like yours ` +
      `keeps us motivated. We look forward to serving you again!\n\n` +
      `— ${ownerName}, ${contractorName}`
    );
  }

  if (rating === 3) {
    return (
      `Thank you for your feedback, ${reviewerName}. We appreciate you taking the time ` +
      `to share your experience with your ${serviceInferred} service. ` +
      `We always strive for five-star service and would love the opportunity ` +
      `to learn how we can improve. Please feel free to reach out to us directly ` +
      `at ${phone} — we'd be happy to discuss your experience further.\n\n` +
      `— ${ownerName}, ${contractorName}`
    );
  }

  // 1-2 star
  return (
    `${reviewerName}, we sincerely apologize that your experience with ${contractorName} ` +
    `did not meet your expectations. This is not the standard we hold ourselves to, ` +
    `and we take your feedback very seriously. We would like the opportunity to make ` +
    `this right. Please call us directly at ${phone} so we can discuss what happened ` +
    `and find a resolution.\n\n` +
    `— ${ownerName}, ${contractorName}`
  );
}

/**
 * Create a review alert with suggested response and notification channels.
 *
 * Channels are determined by severity:
 * - Critical (1-2 star): SMS + email + Telegram
 * - Warning (3 star): email + Telegram
 * - Info (4-5 star): Telegram only
 *
 * @param rating - Star rating.
 * @param reviewerName - Name of the reviewer.
 * @param text - The review text.
 * @param contractorName - Business name.
 * @param ownerName - Owner's name.
 * @param phone - Business phone.
 * @returns A ReviewAlert with suggested response and notification channels.
 */
export function createReviewAlert(
  rating: number,
  reviewerName: string,
  text: string,
  contractorName: string,
  ownerName: string,
  phone: string
): ReviewAlert {
  const { sentiment, alertLevel } = classifyReview(rating);

  let channels: ("sms" | "email" | "telegram")[];
  switch (alertLevel) {
    case "critical":
      channels = ["sms", "email", "telegram"];
      break;
    case "warning":
      channels = ["email", "telegram"];
      break;
    default:
      channels = ["telegram"];
  }

  const suggestedResponse = generateReviewResponse(
    rating,
    reviewerName,
    "service",
    contractorName,
    ownerName,
    phone
  );

  return {
    reviewerName,
    rating,
    text,
    sentiment,
    alertLevel,
    channels,
    suggestedResponse,
  };
}

/**
 * Calculate aggregate review metrics from a list of reviews.
 *
 * @param reviews - Array of review objects with rating, date, response info.
 * @returns Aggregated ReviewMetrics including velocity, response rate, and sentiment.
 */
export function calculateReviewMetrics(
  reviews: Array<{
    rating: number;
    date: Date;
    hasResponse: boolean;
    responseDate?: Date;
  }>
): ReviewMetrics {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      reviewVelocity: 0,
      responseRate: 0,
      avgResponseTimeHours: 0,
      sentimentTrend: { positive: 0, neutral: 0, negative: 0 },
    };
  }

  const totalReviews = reviews.length;

  // Average rating
  const averageRating =
    Math.round(
      (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 100
    ) / 100;

  // Review velocity: reviews per month over trailing 3 months
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const recentReviews = reviews.filter(
    (r) => r.date.getTime() >= threeMonthsAgo.getTime()
  );
  const reviewVelocity =
    Math.round((recentReviews.length / 3) * 100) / 100;

  // Response rate
  const respondedCount = reviews.filter((r) => r.hasResponse).length;
  const responseRate =
    Math.round((respondedCount / totalReviews) * 10000) / 100;

  // Average response time (only for reviews that have responses with dates)
  const responseTimes = reviews
    .filter((r) => r.hasResponse && r.responseDate)
    .map((r) => {
      const diffMs = (r.responseDate as Date).getTime() - r.date.getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60)); // hours
    });

  const avgResponseTimeHours =
    responseTimes.length > 0
      ? Math.round(
          (responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length) *
            100
        ) / 100
      : 0;

  // Sentiment trend
  const sentimentTrend = { positive: 0, neutral: 0, negative: 0 };
  for (const review of reviews) {
    const { sentiment } = classifyReview(review.rating);
    sentimentTrend[sentiment]++;
  }

  return {
    totalReviews,
    averageRating,
    reviewVelocity,
    responseRate,
    avgResponseTimeHours,
    sentimentTrend,
  };
}

/**
 * Format a review alert for Telegram notification.
 *
 * @param alert - The ReviewAlert to format.
 * @returns Formatted Telegram message string (Markdown).
 */
export function formatReviewAlertForTelegram(alert: ReviewAlert): string {
  const stars = "\u2B50".repeat(alert.rating);
  const levelEmoji =
    alert.alertLevel === "critical"
      ? "\uD83D\uDEA8"
      : alert.alertLevel === "warning"
        ? "\u26A0\uFE0F"
        : "\u2705";

  const lines = [
    `${levelEmoji} *New ${alert.rating}-Star Review* ${stars}`,
    `*From:* ${alert.reviewerName}`,
    "",
    `"${alert.text}"`,
    "",
    `*Sentiment:* ${alert.sentiment}`,
    `*Alert Level:* ${alert.alertLevel.toUpperCase()}`,
    "",
    `*Suggested Response:*`,
    alert.suggestedResponse,
  ];

  return lines.join("\n");
}

// ─── Competitive Monitoring Functions ────────────────────────

/**
 * Compare the client's review profile against a competitor.
 *
 * @param clientReviews - Client's total review count.
 * @param clientRating - Client's average rating.
 * @param competitorReviews - Competitor's total review count.
 * @param competitorRating - Competitor's average rating.
 * @param competitorName - Competitor's business name.
 * @returns CompetitorReviewStatus with gap analysis.
 */
export function compareWithCompetitor(
  clientReviews: number,
  clientRating: number,
  competitorReviews: number,
  competitorRating: number,
  competitorName: string
): CompetitorReviewStatus {
  const gap = clientReviews - competitorReviews;
  const clientAhead = gap > 0 || (gap === 0 && clientRating >= competitorRating);

  return {
    competitorName,
    totalReviews: competitorReviews,
    averageRating: competitorRating,
    clientTotalReviews: clientReviews,
    clientAverageRating: clientRating,
    clientAhead,
    gap,
  };
}

/**
 * Determine whether the client should accelerate review acquisition
 * based on competitive analysis.
 *
 * Triggers acceleration if:
 * - Client is behind ANY competitor by 10+ reviews
 * - Client's average rating is below any competitor by 0.3+ stars
 * - Client has fewer reviews than the majority of competitors
 *
 * @param competitors - Array of competitor review comparisons.
 * @returns Whether to accelerate and the reason.
 */
export function shouldAccelerateReviews(
  competitors: CompetitorReviewStatus[]
): { accelerate: boolean; reason: string } {
  if (competitors.length === 0) {
    return { accelerate: false, reason: "No competitor data available." };
  }

  // Check for significant review count gaps
  const bigGapCompetitor = competitors.find((c) => c.gap < -10);
  if (bigGapCompetitor) {
    return {
      accelerate: true,
      reason:
        `Behind ${bigGapCompetitor.competitorName} by ${Math.abs(bigGapCompetitor.gap)} reviews. ` +
        `Accelerate review requests to close the gap.`,
    };
  }

  // Check for rating gaps
  const ratingGapCompetitor = competitors.find(
    (c) => c.averageRating - c.clientAverageRating >= 0.3
  );
  if (ratingGapCompetitor) {
    return {
      accelerate: true,
      reason:
        `${ratingGapCompetitor.competitorName} has a ${ratingGapCompetitor.averageRating} average ` +
        `vs your ${ratingGapCompetitor.clientAverageRating}. Focus on delivering exceptional ` +
        `service and requesting reviews from satisfied customers.`,
    };
  }

  // Check if behind majority
  const behindCount = competitors.filter((c) => !c.clientAhead).length;
  if (behindCount > competitors.length / 2) {
    return {
      accelerate: true,
      reason:
        `Behind ${behindCount} of ${competitors.length} competitors in review count. ` +
        `Increase review request frequency.`,
    };
  }

  return {
    accelerate: false,
    reason: "Review profile is competitive. Maintain current review request cadence.",
  };
}
