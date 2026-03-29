import crypto from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isValidWebhookUrl } from "@/lib/webhooks";
import { routeAlert } from "@/lib/telegram/alerts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Retry delays in milliseconds: immediate, 30s, 5min. */
const RETRY_DELAYS_MS = [0, 30_000, 300_000] as const;
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length;
const REQUEST_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeliveryStatus = "pending" | "delivered" | "failed" | "dead_letter";

/** Shape of the JSON body sent to webhook consumers. */
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/** Summary returned after a delivery attempt completes (or exhausts retries). */
export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  attempts: number;
  error?: string;
}

interface AttemptRecord {
  attempt: number;
  timestamp: string;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
}

interface DeliveryResult {
  statusCode: number | null;
  responseBody: string;
  responseTimeMs: number;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Payload signing
// ---------------------------------------------------------------------------

/**
 * Signs a webhook payload string with HMAC-SHA256.
 * Returns the hex-encoded signature for use in the
 * `X-Webhook-Signature` header.
 */
export function signWebhookPayload(
  payload: string,
  secret: string,
): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ---------------------------------------------------------------------------
// HTTP request helper
// ---------------------------------------------------------------------------

async function sendRequest(
  url: string,
  body: string,
  signature: string,
): Promise<DeliveryResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "User-Agent": "SovereignAI-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
    });

    const responseBody = await response.text().catch(() => "");
    const responseTimeMs = Date.now() - start;

    return {
      statusCode: response.status,
      responseBody,
      responseTimeMs,
      success: response.status >= 200 && response.status < 300,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - start;
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      statusCode: null,
      responseBody: message,
      responseTimeMs,
      success: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Dead letter queue
// ---------------------------------------------------------------------------

async function moveToDeadLetter(
  logId: string,
  endpointId: string,
  url: string,
  event: string,
  payload: string,
  lastError: string,
  attemptLog: AttemptRecord[],
): Promise<void> {
  const now = new Date();

  // Update the WebhookLog status
  await prisma.webhookLog.update({
    where: { id: logId },
    data: {
      status: "dead_letter" satisfies DeliveryStatus,
      deadLetteredAt: now,
      lastError,
    },
  });

  // Create an AuditLog entry for the dead letter
  const metadata = JSON.stringify({
    webhookLogId: logId,
    endpointId,
    url,
    event,
    error: lastError,
    attemptTimestamps: attemptLog.map((a) => a.timestamp),
    attemptCount: attemptLog.length,
    payload: payload.length > 2000 ? payload.substring(0, 2000) : payload,
  });

  await prisma.auditLog.create({
    data: {
      accountId: null,
      action: "webhook_dead_letter",
      resource: "webhook_delivery",
      resourceId: logId,
      metadata,
    },
  });

  // Send Telegram alert for critical webhook failures
  routeAlert({
    level: "critical",
    title: "Webhook Dead Letter",
    message: [
      `Webhook delivery exhausted all retries.`,
      `Event: ${event}`,
      `URL: ${url}`,
      `Error: ${lastError}`,
      `Attempts: ${attemptLog.length}`,
      `Log ID: ${logId}`,
    ].join("\n"),
  }).catch((err) => {
    logger.errorWithCause(
      "[webhook-delivery] Failed to send dead letter alert",
      err,
    );
  });

  logger.error("[webhook-delivery] Moved to dead letter queue", {
    logId,
    endpointId,
    url,
    event,
    attempts: attemptLog.length,
  });
}

// ---------------------------------------------------------------------------
// Core delivery with retry
// ---------------------------------------------------------------------------

/**
 * Deliver a webhook payload with exponential backoff retry.
 *
 * Retry schedule: immediate, 30 seconds, 5 minutes (3 total attempts).
 * Each attempt has a 10-second timeout.
 * On exhaustion, the delivery is moved to the dead letter queue.
 */
export async function deliverWebhook(
  endpointId: string,
  url: string,
  webhookSecret: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  // Validate URL (SSRF protection)
  if (!isValidWebhookUrl(url)) {
    logger.warn("[webhook-delivery] Blocked fetch to disallowed URL", {
      url,
      endpointId,
    });
    return;
  }

  const webhookPayload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  };
  const body = JSON.stringify(webhookPayload);

  // HMAC signature
  const signature = signWebhookPayload(body, webhookSecret);

  // Create the log entry up front
  let logId: string;
  try {
    const log = await prisma.webhookLog.create({
      data: {
        endpointId,
        event,
        payload: body,
        status: "pending" satisfies DeliveryStatus,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
      },
    });
    logId = log.id;
  } catch (err) {
    logger.errorWithCause(
      "[webhook-delivery] Failed to create delivery log",
      err,
    );
    return;
  }

  const attemptLog: AttemptRecord[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Wait for the retry delay (0 for first attempt)
    const delay = RETRY_DELAYS_MS[attempt - 1];
    if (delay > 0) {
      await sleep(delay);
    }

    const result = await sendRequest(url, body, signature);

    const record: AttemptRecord = {
      attempt,
      timestamp: new Date().toISOString(),
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.success ? null : result.responseBody.substring(0, 500),
    };
    attemptLog.push(record);

    logger.info("[webhook-delivery] Attempt completed", {
      logId,
      attempt,
      maxAttempts: MAX_ATTEMPTS,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      success: result.success,
    });

    if (result.success) {
      // Delivery succeeded
      try {
        await prisma.webhookLog.update({
          where: { id: logId },
          data: {
            status: "delivered" satisfies DeliveryStatus,
            success: true,
            statusCode: result.statusCode,
            response: result.responseBody.substring(0, 2000),
            responseTimeMs: result.responseTimeMs,
            attempts: attempt,
            attemptLog: JSON.stringify(attemptLog),
            deliveredAt: new Date(),
          },
        });
      } catch (err) {
        logger.errorWithCause(
          "[webhook-delivery] Failed to update log on success",
          err,
        );
      }
      return;
    }

    // Update the log with the current attempt info
    try {
      const nextRetry =
        attempt < MAX_ATTEMPTS
          ? new Date(Date.now() + RETRY_DELAYS_MS[attempt])
          : null;

      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: (attempt < MAX_ATTEMPTS ? "pending" : "failed") satisfies DeliveryStatus,
          statusCode: result.statusCode,
          response: result.responseBody.substring(0, 2000),
          responseTimeMs: result.responseTimeMs,
          attempts: attempt,
          attemptLog: JSON.stringify(attemptLog),
          lastError: result.responseBody.substring(0, 500),
          nextRetryAt: nextRetry,
        },
      });
    } catch (err) {
      logger.errorWithCause(
        "[webhook-delivery] Failed to update log on failure",
        err,
      );
    }
  }

  // All retries exhausted: move to dead letter queue
  const lastAttempt = attemptLog[attemptLog.length - 1];
  const lastError = lastAttempt?.error ?? "All retry attempts exhausted";

  try {
    await moveToDeadLetter(
      logId,
      endpointId,
      url,
      event,
      body,
      lastError,
      attemptLog,
    );
  } catch (err) {
    logger.errorWithCause(
      "[webhook-delivery] Failed to move to dead letter queue",
      err,
    );
  }
}

// ---------------------------------------------------------------------------
// Manual retry from dead letter queue
// ---------------------------------------------------------------------------

/**
 * Manually retry a dead-lettered webhook delivery.
 * Creates a new delivery attempt for the same payload.
 */
export async function retryDeadLetter(logId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const log = await prisma.webhookLog.findUnique({
    where: { id: logId },
    include: { endpoint: true },
  });

  if (!log) {
    return { success: false, error: "Webhook log not found" };
  }

  if (log.status !== "dead_letter") {
    return { success: false, error: "Only dead letter entries can be retried" };
  }

  if (!log.endpoint.isActive) {
    return { success: false, error: "Webhook endpoint is inactive" };
  }

  // Parse the original payload
  let parsedPayload: { event?: string; data?: Record<string, unknown> };
  try {
    parsedPayload = JSON.parse(log.payload) as {
      event?: string;
      data?: Record<string, unknown>;
    };
  } catch {
    return { success: false, error: "Invalid payload in log" };
  }

  // Reset the log status to pending for re-delivery
  await prisma.webhookLog.update({
    where: { id: logId },
    data: {
      status: "pending" satisfies DeliveryStatus,
      attempts: 0,
      attemptLog: null,
      lastError: null,
      nextRetryAt: null,
      deadLetteredAt: null,
      deliveredAt: null,
      success: false,
    },
  });

  // Re-deliver asynchronously (fire-and-forget)
  deliverWebhook(
    log.endpointId,
    log.endpoint.url,
    log.endpoint.secret,
    parsedPayload.event ?? log.event,
    parsedPayload.data ?? {},
  ).catch((err) => {
    logger.errorWithCause(
      "[webhook-delivery] Dead letter retry failed",
      err,
      { logId },
    );
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
