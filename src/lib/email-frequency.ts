import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const TAG = "[email-frequency]";

/**
 * Default maximum emails a single recipient can receive per 24-hour window.
 * Applies across all email types (welcome-drip, re-engagement, abandoned-cart,
 * weekly-report, etc.) to prevent over-emailing.
 */
const DEFAULT_MAX_PER_DAY = 2;

/**
 * Check whether the recipient can receive another email without exceeding
 * the per-recipient daily frequency cap.
 *
 * Queries the `EmailQueue` table for emails sent (status = "sent") or
 * currently queued (status = "pending" | "sending") to this recipient in
 * the last 24 hours. If the count meets or exceeds `maxPerDay`, the
 * recipient is capped.
 *
 * This is a non-blocking guard: it never throws. On DB errors it logs a
 * warning and returns `true` (fail-open) so transactional emails are not
 * accidentally suppressed by infrastructure issues.
 *
 * @param recipientEmail - The email address to check
 * @param clientId       - The client initiating the send (logged for observability)
 * @param maxPerDay      - Maximum emails per recipient per 24h (default: 2)
 * @returns `true` if the email can be sent, `false` if the cap is reached
 */
export async function canSendEmail(
  recipientEmail: string,
  clientId: string,
  maxPerDay: number = DEFAULT_MAX_PER_DAY,
): Promise<boolean> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentCount = await prisma.emailQueue.count({
      where: {
        to: recipientEmail,
        status: { in: ["sent", "pending", "sending"] },
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (recentCount >= maxPerDay) {
      logger.info(
        `${TAG} Frequency cap reached for ${recipientEmail} — ` +
          `${recentCount}/${maxPerDay} emails in last 24h (clientId=${clientId})`,
      );
      return false;
    }

    return true;
  } catch (error) {
    // Fail-open: if the DB query fails, allow the email through rather
    // than silently blocking transactional sends.
    logger.warn(`${TAG} Failed to check frequency cap — allowing send`, {
      recipientEmail,
      clientId,
      error: error instanceof Error ? error.message : String(error),
    });
    return true;
  }
}
