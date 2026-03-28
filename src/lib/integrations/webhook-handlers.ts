/**
 * Webhook Handlers — Inbound registry and outbound webhook system
 * for the Sovereign Empire platform.
 *
 * Inbound: Validates incoming webhooks from Stripe, Twilio, VAPI, etc.
 * Outbound: Sends signed webhooks to external consumers with retry logic.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Inbound Webhook Registry
// ---------------------------------------------------------------------------

/** Describes a registered inbound webhook endpoint. */
export interface WebhookEndpoint {
  path: string;
  source: string;
  authMethod:
    | "stripe_signature"
    | "twilio_signature"
    | "bearer_token"
    | "hmac_signature"
    | "none";
  events: string[];
  description: string;
}

/** All registered inbound webhook endpoints. */
export const INBOUND_WEBHOOKS: WebhookEndpoint[] = [
  {
    path: "/api/webhooks/stripe",
    source: "Stripe",
    authMethod: "stripe_signature",
    events: [
      "payment_intent.succeeded",
      "invoice.payment_failed",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ],
    description: "Stripe payment and subscription events",
  },
  {
    path: "/api/webhooks/twilio/sms",
    source: "Twilio",
    authMethod: "twilio_signature",
    events: ["inbound_sms"],
    description: "Inbound SMS from leads (replies, opt-outs)",
  },
  {
    path: "/api/webhooks/twilio/voice",
    source: "Twilio",
    authMethod: "twilio_signature",
    events: ["call_status_update"],
    description: "Call status updates",
  },
  {
    path: "/api/webhooks/vapi",
    source: "VAPI",
    authMethod: "bearer_token",
    events: ["call.ended", "call.transcript.complete"],
    description: "Voice AI call completion and transcript events",
  },
  {
    path: "/api/webhooks/email",
    source: "Email Provider",
    authMethod: "none",
    events: ["bounce", "complaint", "delivery"],
    description: "Email delivery status events",
  },
];

// ---------------------------------------------------------------------------
// Outbound Webhook Types
// ---------------------------------------------------------------------------

/** Event types emitted by the Sovereign platform. */
export type OutboundEventType =
  | "lead.qualified"
  | "lead.converted"
  | "appointment.booked";

/** Configuration for an outbound webhook consumer. */
export interface OutboundWebhookConfig {
  url: string;
  secret: string;
  events: OutboundEventType[];
  retryAttempts: number;
  retryBackoffMs: number[];
}

/** Payload shape sent to outbound webhook consumers. */
export interface OutboundWebhookPayload {
  event: OutboundEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Signature Verification
// ---------------------------------------------------------------------------

/**
 * Verify a Stripe webhook signature using timing-safe comparison.
 *
 * Stripe signs the payload with `HMAC-SHA256(timestamp + "." + payload, secret)`
 * and sends the result in the `Stripe-Signature` header.
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const sigPart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.slice(2);
    const expectedSig = sigPart.slice(3);

    const signedPayload = `${timestamp}.${payload}`;
    const computed = createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSig, "hex");
    const computedBuf = Buffer.from(computed, "hex");

    if (expectedBuf.length !== computedBuf.length) return false;

    return timingSafeEqual(expectedBuf, computedBuf);
  } catch (err) {
    logger.warn("Stripe signature verification failed", { error: String(err) });
    return false;
  }
}

/**
 * Verify a Twilio request signature.
 *
 * Twilio signs `URL + sorted params` with `HMAC-SHA1(data, authToken)`
 * and base64-encodes the result.
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string,
): boolean {
  try {
    const sortedKeys = Object.keys(params).sort();
    const dataStr =
      url + sortedKeys.map((k) => `${k}${params[k]}`).join("");

    const computed = createHmac("sha1", authToken)
      .update(dataStr)
      .digest("base64");

    const expectedBuf = Buffer.from(signature, "base64");
    const computedBuf = Buffer.from(computed, "base64");

    if (expectedBuf.length !== computedBuf.length) return false;

    return timingSafeEqual(expectedBuf, computedBuf);
  } catch (err) {
    logger.warn("Twilio signature verification failed", { error: String(err) });
    return false;
  }
}

/**
 * Verify a generic HMAC-SHA256 signature (hex-encoded) with timing-safe comparison.
 */
export function verifyHMACSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const computed = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const expectedBuf = Buffer.from(signature, "hex");
    const computedBuf = Buffer.from(computed, "hex");

    if (expectedBuf.length !== computedBuf.length) return false;

    return timingSafeEqual(expectedBuf, computedBuf);
  } catch (err) {
    logger.warn("HMAC signature verification failed", { error: String(err) });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Outbound Webhook Sending
// ---------------------------------------------------------------------------

/**
 * Generate an HMAC-SHA256 hex digest of the given payload.
 */
export function generateSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Result returned by {@link sendOutboundWebhook}. */
export interface OutboundWebhookResult {
  success: boolean;
  statusCode?: number;
  attempts: number;
}

/**
 * Send a signed outbound webhook with retry logic.
 *
 * Headers included:
 * - `X-Sovereign-Signature` — HMAC-SHA256 hex digest of the JSON body
 * - `X-Sovereign-Event` — the event type
 * - `X-Sovereign-Timestamp` — ISO-8601 timestamp
 *
 * Retries up to {@link OutboundWebhookConfig.retryAttempts} times
 * (default backoff: 1 000 ms, 2 000 ms, 4 000 ms).
 */
export async function sendOutboundWebhook(
  config: OutboundWebhookConfig,
  event: OutboundEventType,
  data: Record<string, unknown>,
): Promise<OutboundWebhookResult> {
  const timestamp = new Date().toISOString();

  const payload: OutboundWebhookPayload = { event, timestamp, data };
  const body = JSON.stringify(payload);
  const signature = generateSignature(body, config.secret);

  const backoff =
    config.retryBackoffMs.length > 0
      ? config.retryBackoffMs
      : [1000, 2000, 4000];

  const maxAttempts = Math.max(1, config.retryAttempts);
  let lastStatusCode: number | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sovereign-Signature": signature,
          "X-Sovereign-Event": event,
          "X-Sovereign-Timestamp": timestamp,
        },
        body,
      });

      lastStatusCode = response.status;

      if (response.ok) {
        return { success: true, statusCode: response.status, attempts: attempt };
      }
    } catch {
      // Network error — will retry
    }

    // Wait before next retry (skip wait after last attempt)
    if (attempt < maxAttempts) {
      const delayMs = backoff[Math.min(attempt - 1, backoff.length - 1)];
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { success: false, statusCode: lastStatusCode, attempts: maxAttempts };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Look up an inbound webhook endpoint by its path.
 * Returns `null` if no endpoint matches.
 */
export function getWebhookEndpoint(path: string): WebhookEndpoint | null {
  return INBOUND_WEBHOOKS.find((ep) => ep.path === path) ?? null;
}

/** Valid inbound webhook source names. */
const VALID_SOURCES = new Set(INBOUND_WEBHOOKS.map((ep) => ep.source));

/**
 * Check whether a source name corresponds to a registered inbound webhook.
 */
export function isValidWebhookSource(source: string): boolean {
  return VALID_SOURCES.has(source);
}
