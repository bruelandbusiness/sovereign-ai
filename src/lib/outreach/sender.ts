/**
 * Cold outreach sending engine.
 *
 * Uses the existing SendGrid integration from email.ts.
 * Handles warmup curves, tracking pixel injection, link rewriting,
 * template personalization, and daily send limits.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { htmlToPlainText } from "@/lib/email";
import { getCircuitBreaker } from "@/lib/circuit-breaker";

const TAG = "[cold-outreach-sender]";

/** Reuse the sendgrid circuit breaker (shared with email.ts). */
const sendgridBreaker = getCircuitBreaker("sendgrid");

/** Timeout for SendGrid API calls in cold outreach (15 seconds). */
const SENDGRID_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecipientPersonalization {
  name: string;
  company: string;
  vertical: string;
  city: string;
}

interface CampaignSendResult {
  sent: number;
  skipped: number;
  failed: number;
}

// ---------------------------------------------------------------------------
// Warmup curve calculation
// ---------------------------------------------------------------------------

/**
 * Calculate how many emails can be sent today based on warmup settings.
 *
 * If warmup is enabled, starts at `warmupStartSent` and increases by
 * `warmupRampRate` per day since the campaign started, capped at `dailySendLimit`.
 */
export function calculateTodayLimit(campaign: {
  warmupEnabled: boolean;
  warmupStartSent: number;
  warmupRampRate: number;
  dailySendLimit: number;
  startedAt: Date | null;
}): number {
  if (!campaign.warmupEnabled || !campaign.startedAt) {
    return campaign.dailySendLimit;
  }

  const daysSinceStart = Math.floor(
    (Date.now() - campaign.startedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  const warmupLimit =
    campaign.warmupStartSent + daysSinceStart * campaign.warmupRampRate;

  return Math.min(warmupLimit, campaign.dailySendLimit);
}

// ---------------------------------------------------------------------------
// Personalization
// ---------------------------------------------------------------------------

/**
 * Replace template variables with recipient-specific data.
 * Supported: {{name}}, {{company}}, {{vertical}}, {{city}}
 */
export function personalizeContent(
  template: string,
  data: RecipientPersonalization
): string {
  return template
    .replace(/\{\{name\}\}/g, data.name || "there")
    .replace(/\{\{company\}\}/g, data.company || "your company")
    .replace(/\{\{vertical\}\}/g, data.vertical || "home service")
    .replace(/\{\{city\}\}/g, data.city || "your area");
}

// ---------------------------------------------------------------------------
// Tracking injection
// ---------------------------------------------------------------------------

/**
 * Build the open-tracking pixel URL for a given tracking ID.
 */
function openTrackingUrl(trackingId: string): string {
  const base = env.NEXT_PUBLIC_APP_URL;
  return `${base}/api/outreach/track/open/${trackingId}`;
}

/**
 * Build the click-tracking redirect URL for a given tracking ID.
 */
function clickTrackingUrl(trackingId: string, destination: string): string {
  const base = env.NEXT_PUBLIC_APP_URL;
  const encoded = encodeURIComponent(destination);
  return `${base}/api/outreach/track/click/${trackingId}?url=${encoded}`;
}

/**
 * Inject a 1x1 tracking pixel before </body> (or at the end) of the HTML.
 */
export function injectTrackingPixel(html: string, trackingId: string): string {
  const pixel = `<img src="${openTrackingUrl(trackingId)}" width="1" height="1" alt="" style="display:none;border:0;" />`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  // No </body> tag — just append
  return html + pixel;
}

/**
 * Rewrite all <a href="..."> links to go through the click tracker.
 * Skips mailto: links and anchor-only links.
 */
export function rewriteLinks(html: string, trackingId: string): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match, url: string) => {
      return `href="${clickTrackingUrl(trackingId, url)}"`;
    }
  );
}

// ---------------------------------------------------------------------------
// Subject selection
// ---------------------------------------------------------------------------

/**
 * Pick a random subject variant from the list for A/B testing.
 */
export function pickSubject(
  variants: string[],
  data: RecipientPersonalization
): string {
  if (variants.length === 0) return "Quick question";
  const variant = variants[Math.floor(Math.random() * variants.length)];
  return personalizeContent(variant, data);
}

// ---------------------------------------------------------------------------
// Randomized send delay
// ---------------------------------------------------------------------------

/**
 * Return a random delay in milliseconds to spread sends across business hours.
 * The cron is expected to run every ~15 minutes during 8am-6pm;
 * this adds a small jitter (0-120 seconds) to avoid burst patterns.
 */
function randomJitterMs(): number {
  return Math.floor(Math.random() * 120_000);
}

/** Sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Core send function for a single recipient
// ---------------------------------------------------------------------------

/**
 * Send a cold email to a single recipient with full tracking.
 */
async function sendColdEmail(
  recipient: {
    id: string;
    email: string;
    name: string | null;
    company: string | null;
    vertical: string | null;
    city: string | null;
    trackingId: string;
  },
  campaign: {
    fromEmail: string;
    fromName: string;
    subjectVariants: string;
    bodyTemplate: string;
  }
): Promise<void> {
  const personalization: RecipientPersonalization = {
    name: recipient.name || "there",
    company: recipient.company || "your company",
    vertical: recipient.vertical || "home service",
    city: recipient.city || "your area",
  };

  // Parse subject variants
  let subjectVariants: string[];
  try {
    subjectVariants = JSON.parse(campaign.subjectVariants) as string[];
  } catch {
    subjectVariants = [campaign.subjectVariants];
  }

  // Pick subject and personalize
  const subject = pickSubject(subjectVariants, personalization);

  // Personalize body
  let html = personalizeContent(campaign.bodyTemplate, personalization);

  // Rewrite links for click tracking
  html = rewriteLinks(html, recipient.trackingId);

  // Inject tracking pixel
  html = injectTrackingPixel(html, recipient.trackingId);

  // Send via existing SendGrid integration
  // Note: sendEmail uses FROM_EMAIL from env, but for cold outreach we need
  // custom from. We'll set it directly with SendGrid API.
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  if (!SENDGRID_API_KEY) {
    logger.info(`${TAG} [DEV] Skipping cold email send — no SendGrid API key`, {
      email: recipient.email,
      subject,
    });
    return;
  }

  // Generate plain-text fallback for deliverability (HTML-only emails
  // are flagged by spam filters and inaccessible to text-only clients).
  const plainText = htmlToPlainText(html);

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;

  await sendgridBreaker.execute(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SENDGRID_TIMEOUT_MS);

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient.email }] }],
          from: { email: campaign.fromEmail, name: campaign.fromName },
          reply_to: { email: campaign.fromEmail, name: campaign.fromName },
          subject,
          content: [
            { type: "text/plain", value: plainText },
            { type: "text/html", value: html },
          ],
          // RFC 8058: List-Unsubscribe + List-Unsubscribe-Post for one-click
          // unsubscribe. Gmail/Yahoo require both headers since Feb 2024.
          headers: {
            "List-Unsubscribe": `<${unsubUrl}>, <mailto:unsubscribe@trysovereignai.com?subject=unsubscribe>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown");
        throw new Error(`SendGrid returned ${response.status}: ${errorBody}`);
      }
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(`SendGrid request timed out after ${SENDGRID_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  });

  // Update recipient record with the subject that was used
  await prisma.coldEmailRecipient.update({
    where: { id: recipient.id },
    data: {
      status: "sent",
      sentAt: new Date(),
      subjectUsed: subject,
    },
  });
}

// ---------------------------------------------------------------------------
// Campaign-level send orchestrator
// ---------------------------------------------------------------------------

/**
 * Process sending for a single active campaign.
 *
 * 1. Calculates today's limit (warmup curve or daily limit)
 * 2. Counts how many were already sent today
 * 3. Picks pending recipients up to the remaining limit
 * 4. Sends with randomized jitter between emails
 * 5. Updates recipient statuses
 */
export async function processCampaignSends(
  campaignId: string
): Promise<CampaignSendResult> {
  const campaign = await prisma.coldOutreachCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.status !== "active") {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  // Calculate today's limit
  const todayLimit = calculateTodayLimit(campaign);

  // Count already sent today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sentToday = await prisma.coldEmailRecipient.count({
    where: {
      campaignId,
      status: "sent",
      sentAt: { gte: todayStart },
    },
  });

  const remaining = Math.max(0, todayLimit - sentToday);
  if (remaining === 0) {
    logger.info(`${TAG} Campaign ${campaignId}: daily limit reached (${todayLimit})`);
    return { sent: 0, skipped: 0, failed: 0 };
  }

  // Pick pending recipients
  const recipients = await prisma.coldEmailRecipient.findMany({
    where: {
      campaignId,
      status: "pending",
    },
    take: remaining,
    orderBy: { createdAt: "asc" },
  });

  if (recipients.length === 0) {
    // No more pending recipients — mark campaign complete
    await prisma.coldOutreachCampaign.update({
      where: { id: campaignId },
      data: { status: "completed" },
    });
    logger.info(`${TAG} Campaign ${campaignId}: no pending recipients, marked completed`);
    return { sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      // Add jitter between sends
      if (sent > 0) {
        await sleep(randomJitterMs());
      }

      await sendColdEmail(recipient, campaign);
      sent++;

      logger.info(`${TAG} Cold email sent`, {
        email: recipient.email,
        campaign: campaign.name,
      });
    } catch (error) {
      failed++;

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check if it bounced
      const isBounce =
        errorMessage.includes("550") ||
        errorMessage.includes("bounce") ||
        errorMessage.includes("invalid");

      await prisma.coldEmailRecipient.update({
        where: { id: recipient.id },
        data: {
          status: isBounce ? "bounced" : "pending", // retry non-bounces next run
          ...(isBounce ? { bouncedAt: new Date() } : {}),
        },
      });

      logger.errorWithCause(
        `${TAG} Failed to send to ${recipient.email}`,
        error,
        { campaignId, recipientId: recipient.id }
      );
    }
  }

  return { sent, skipped: 0, failed };
}

// ---------------------------------------------------------------------------
// Process all active campaigns
// ---------------------------------------------------------------------------

/**
 * Find all active campaigns and process sends for each.
 * Called by the cron route.
 */
export async function processAllCampaignSends(): Promise<{
  campaignsProcessed: number;
  totalSent: number;
  totalFailed: number;
}> {
  const activeCampaigns = await prisma.coldOutreachCampaign.findMany({
    where: { status: "active" },
    orderBy: { startedAt: "asc" },
  });

  let totalSent = 0;
  let totalFailed = 0;

  for (const campaign of activeCampaigns) {
    try {
      const result = await processCampaignSends(campaign.id);
      totalSent += result.sent;
      totalFailed += result.failed;
    } catch (error) {
      logger.errorWithCause(
        `${TAG} Fatal error processing campaign ${campaign.id}`,
        error,
        { campaignId: campaign.id }
      );
    }
  }

  return {
    campaignsProcessed: activeCampaigns.length,
    totalSent,
    totalFailed,
  };
}
