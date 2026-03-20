import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * Check if a recipient email address belongs to a client that has unsubscribed
 * from marketing emails. Used to suppress non-transactional sends.
 */
export async function isUnsubscribedRecipient(email: string): Promise<boolean> {
  const account = await prisma.account.findUnique({
    where: { email },
    select: { client: { select: { id: true } } },
  });
  if (!account?.client) return false;

  const unsubEvent = await prisma.activityEvent.findFirst({
    where: {
      clientId: account.client.id,
      type: "email_unsubscribe",
    },
    select: { id: true },
  });
  return unsubEvent !== null;
}

const MAX_EMAILS_PER_RUN = 50;

/**
 * Minimum delay (ms) between consecutive SendGrid API calls during
 * queue processing. Prevents burst-sending that could trigger rate
 * limits. SendGrid's standard plans allow ~100 emails/s, but applying
 * a small delay avoids 429 responses under load.
 */
const RATE_LIMIT_DELAY_MS = 100;

/** Helper: sleep for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * How long an email can stay in "sending" status before we consider it stuck.
 * If the process crashes mid-send, these emails would otherwise be orphaned.
 */
const STUCK_SENDING_TIMEOUT_MINUTES = 15;

interface QueueEmailOptions {
  scheduledAt?: Date;
  maxAttempts?: number;
}

/**
 * Add an email to the queue for asynchronous sending.
 * Returns the queue entry ID.
 */
export async function queueEmail(
  to: string,
  subject: string,
  html: string,
  options?: QueueEmailOptions
): Promise<string> {
  // Bounce suppression at queue time: reject emails to known-bad addresses
  // early to avoid filling the queue with undeliverable messages.
  const bounced = await isBouncedRecipient(to);
  if (bounced) {
    throw new Error(
      `Cannot queue email to ${to}: recipient address has previously bounced`
    );
  }

  // Defense-in-depth: strip newline characters from subject to prevent
  // email header injection, even though callers should already sanitize.
  const safeSubject = subject.replace(/[\r\n]/g, " ").trim();

  const entry = await prisma.emailQueue.create({
    data: {
      to,
      subject: safeSubject,
      html,
      scheduledAt: options?.scheduledAt ?? new Date(),
      maxAttempts: options?.maxAttempts ?? 3,
    },
  });

  return entry.id;
}

/**
 * Process pending emails from the queue.
 * Sends up to MAX_EMAILS_PER_RUN emails per invocation.
 *
 * Uses an atomic UPDATE … RETURNING to claim pending emails by setting their
 * status to 'sending', preventing concurrent cron invocations from processing
 * the same emails (idempotency via row-level atomicity in PostgreSQL).
 *
 * Returns counts of sent and failed emails.
 */
export async function processEmailQueue(): Promise<{
  sent: number;
  failed: number;
  recovered: number;
}> {
  // First, recover any emails stuck in "sending" status from a previous
  // crashed run. This must happen before claiming new emails.
  const recovered = await recoverStuckEmails();

  const now = new Date();

  // Atomically claim a batch of pending emails by setting status = 'sending'.
  // The UPDATE … WHERE … RETURNING pattern ensures that if two cron
  // invocations overlap, each row is claimed by exactly one of them.
  const claimedEmails = await prisma.$queryRaw<
    Array<{
      id: string;
      to: string;
      subject: string;
      html: string;
      status: string;
      attempts: number;
      maxAttempts: number;
      lastError: string | null;
      messageId: string | null;
      scheduledAt: Date;
      sentAt: Date | null;
      createdAt: Date;
    }>
  >(
    Prisma.sql`UPDATE "EmailQueue"
     SET "status" = 'sending'
     WHERE "id" IN (
       SELECT "id" FROM "EmailQueue"
       WHERE "status" = 'pending'
         AND "scheduledAt" <= ${now}
       ORDER BY "scheduledAt" ASC
       LIMIT ${MAX_EMAILS_PER_RUN}
     )
     RETURNING *`
  );

  let sent = 0;
  let failed = 0;

  for (let idx = 0; idx < claimedEmails.length; idx++) {
    const email = claimedEmails[idx];
    const newAttempts = email.attempts + 1;

    // Rate limiting: pause between sends to avoid SendGrid throttling (429).
    if (idx > 0) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    // Bounce suppression: skip emails to addresses that have previously bounced.
    // This protects sender reputation and avoids wasting API calls.
    const bounced = await isBouncedRecipient(email.to);
    if (bounced) {
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: "failed",
          attempts: newAttempts,
          lastError: "Suppressed: recipient address has previously bounced",
        },
      });
      failed++;
      continue;
    }

    // Unsubscribe suppression: skip marketing emails to clients who opted out.
    const unsubscribed = await isUnsubscribedRecipient(email.to);
    if (unsubscribed) {
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: "failed",
          attempts: newAttempts,
          lastError: "Suppressed: recipient has unsubscribed from marketing emails",
        },
      });
      failed++;
      continue;
    }

    try {
      const messageId = await sendEmail(email.to, email.subject, email.html);

      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: "sent",
          attempts: newAttempts,
          messageId: messageId ?? null,
          sentAt: new Date(),
          lastError: null,
        },
      });

      sent++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Detect SendGrid 429 (rate-limited) and apply exponential backoff.
      const isRateLimited = errorMessage.includes("429");
      if (isRateLimited) {
        const backoffMs = Math.min(1000 * Math.pow(2, email.attempts), 30_000);
        logger.warn("SendGrid rate limit hit — backing off", {
          emailId: email.id,
          backoffMs,
        });
        await sleep(backoffMs);
      }

      if (newAttempts >= email.maxAttempts) {
        // Max attempts reached — mark as failed
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: "failed",
            attempts: newAttempts,
            lastError: errorMessage,
          },
        });
        failed++;
      } else {
        // Still has retries left — reset back to pending for retry.
        // Apply exponential backoff by scheduling retry in the future.
        const retryDelayMs = Math.min(
          60_000 * Math.pow(2, email.attempts),
          600_000
        ); // 1m, 2m, 4m, ... up to 10m
        const retryAt = new Date(Date.now() + retryDelayMs);

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: "pending",
            attempts: newAttempts,
            lastError: errorMessage,
            scheduledAt: retryAt,
          },
        });
      }
    }
  }

  return { sent, failed, recovered };
}

/**
 * Re-queue failed emails that still have retry attempts remaining.
 * Returns the number of emails re-queued.
 */
async function retryFailedEmails(): Promise<number> {
  const result = await prisma.emailQueue.updateMany({
    where: {
      status: "failed",
      attempts: { lt: 3 }, // Only retry if under default maxAttempts
    },
    data: {
      status: "pending",
    },
  });

  return result.count;
}

/**
 * Recover emails stuck in "sending" status.
 *
 * If the process crashes after claiming emails (setting status = "sending")
 * but before completing the send, those emails become orphaned. This function
 * resets them back to "pending" so the next queue run picks them up, as long
 * as they still have retry attempts remaining.
 *
 * Should be called at the start of each queue processing run.
 * Returns the number of emails recovered.
 */
async function recoverStuckEmails(): Promise<number> {
  const cutoff = new Date(
    Date.now() - STUCK_SENDING_TIMEOUT_MINUTES * 60 * 1000
  );

  // Find emails stuck in "sending" for longer than the timeout.
  // Use updatedAt if available, otherwise fall back to createdAt.
  const result = await prisma.emailQueue.updateMany({
    where: {
      status: "sending",
      createdAt: { lt: cutoff },
    },
    data: {
      status: "pending",
      lastError: `Recovered from stuck "sending" status after ${STUCK_SENDING_TIMEOUT_MINUTES} minutes`,
    },
  });

  return result.count;
}

/**
 * Check if a recipient email address has previously bounced.
 * Used to suppress future sends to known-bad addresses and protect sender reputation.
 */
export async function isBouncedRecipient(email: string): Promise<boolean> {
  const bounced = await prisma.emailQueue.findFirst({
    where: {
      to: email,
      status: "bounced",
    },
    select: { id: true },
  });
  return bounced !== null;
}
