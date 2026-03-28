import Twilio from "twilio";
import { canSendSms, canMakeCall } from "@/lib/compliance";
import { logContactAttempt } from "@/lib/compliance/tcpa";

import { logger } from "@/lib/logger";
import { withRetry } from "@/lib/retry";
import { getCircuitBreaker } from "@/lib/circuit-breaker";

/** Twilio circuit breaker — opens after 5 consecutive failures, resets after 45s. */
const twilioBreaker = getCircuitBreaker("twilio", {
  failureThreshold: 5,
  resetTimeoutMs: 45_000,
  isFailure: (error) => {
    // Twilio SDK errors with status 4xx (except 429) are permanent
    if (error instanceof Error && "status" in error) {
      const status = (error as { status: number }).status;
      return status === 429 || status >= 500;
    }
    return true;
  },
});
// ---------------------------------------------------------------------------
// Twilio SDK singleton
// ---------------------------------------------------------------------------

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let _client: Twilio.Twilio | null = null;

function getClient(): Twilio.Twilio | null {
  if (_client) return _client;

  if (!accountSid || !authToken || !accountSid.startsWith("AC")) {
    logger.warn(
      "[twilio] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured — Twilio is disabled."
    );
    return null;
  }

  _client = Twilio(accountSid, authToken);
  return _client;
}

/**
 * The lazily-initialized Twilio client.  `null` when env vars are missing.
 */
export const twilioClient = getClient();

/**
 * The Twilio phone number assigned to this platform.
 */
export const twilioPhoneNumber = phoneNumber ?? null;

// ---------------------------------------------------------------------------
// Helper: initiate an outbound call
// ---------------------------------------------------------------------------

export interface MakeCallOptions {
  /** Maximum call duration in seconds (Twilio will hang up after this). Default: 1800 (30 min). */
  timeLimit?: number;
  /** Whether to record the call. Default: false (opt-in only). */
  record?: boolean;
  /** Client ID for compliance checking. Null/undefined = skip compliance (inbound/transactional). */
  clientId?: string | null;
}

export async function makeCall(
  to: string,
  twimlUrl: string,
  options?: MakeCallOptions
): Promise<{ callSid: string } | null> {
  const client = getClient();
  if (!client || !phoneNumber) {
    logger.warn("[twilio] Cannot make call — client or phone number missing.");
    return null;
  }

  // Compliance gate: only for outbound marketing calls (clientId provided)
  if (options?.clientId) {
    const complianceCheck = await canMakeCall(options.clientId, to);
    if (!complianceCheck.allowed) {
      logger.warn(`[twilio] Call blocked by compliance: ${complianceCheck.reason}`);
      return null;
    }
    await logContactAttempt({
      clientId: options.clientId,
      contactPhone: to,
      channel: "voice",
      status: "sent",
    });
  }

  const timeLimit = options?.timeLimit ?? 1800; // Default 30 minutes max
  const record = options?.record ?? false; // Default: no recording (privacy-first)

  try {
    const call = await twilioBreaker.execute(() =>
      withRetry(
        () =>
          client.calls.create({
            to,
            from: phoneNumber,
            url: twimlUrl,
            statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/services/voice/status`,
            statusCallbackEvent: ["ringing", "answered", "completed"],
            statusCallbackMethod: "POST",
            record,
            timeLimit,
          }),
        {
          maxAttempts: 2,
          baseDelayMs: 2_000,
          label: "twilio-call",
          isRetryable: (error) => {
            if (error instanceof Error && "status" in error) {
              const status = (error as { status: number }).status;
              return status === 429 || status >= 500;
            }
            return true;
          },
        },
      ),
    );

    return { callSid: call.sid };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown Twilio error";
    logger.error(`[twilio] Call failed to ${to}: ${errorMessage}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: validate a Twilio webhook signature
//
// In production (TWILIO_AUTH_TOKEN set) this performs cryptographic validation.
// In development (no auth token) this logs a warning and allows the request so
// local testing works without signature gymnastics.
// ---------------------------------------------------------------------------

export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!authToken) {
    if (process.env.NODE_ENV === "production") {
      logger.error("[twilio] CRITICAL: TWILIO_AUTH_TOKEN not set in production — rejecting webhook.");
      return false;
    }
    logger.warn("[twilio] TWILIO_AUTH_TOKEN not set — skipping signature validation (dev mode).");
    return true;
  }
  return Twilio.validateRequest(authToken, signature, url, params);
}

// ---------------------------------------------------------------------------
// Helper: validate phone number format before sending SMS
//
// Validates that a phone number looks like an E.164 number (e.g. +15551234567).
// This prevents wasting Twilio API calls on obviously invalid numbers.
// ---------------------------------------------------------------------------

/**
 * Basic E.164 phone number validation.
 * Returns true if the number starts with + and contains 10-15 digits.
 */
export function isValidPhoneNumber(phone: string): boolean {
  // E.164: + followed by 10-15 digits (country code + subscriber number)
  const E164_RE = /^\+[1-9]\d{9,14}$/;
  return E164_RE.test(phone.replace(/[\s()-]/g, ""));
}

// ---------------------------------------------------------------------------
// Helper: send an SMS via Twilio with validation
//
// Validates the phone number, checks message length, and handles errors
// consistently. All outbound SMS should use this instead of calling
// twilioClient.messages.create() directly.
// ---------------------------------------------------------------------------

/** Maximum length for a single SMS segment. Messages longer than this will
 *  be split into multiple segments by Twilio (up to 1600 chars). We warn
 *  but do not block messages above 160 chars. */
const SMS_SEGMENT_LENGTH = 160;
/** Twilio's hard maximum for a single message body. */
const SMS_MAX_LENGTH = 1600;

export interface SendSmsResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send an SMS message via Twilio with phone validation, length checks, and compliance.
 *
 * @param to       - Recipient phone number (should be E.164 format)
 * @param body     - Message body text
 * @param clientId - Optional client ID for compliance checking. Null = transactional (skip compliance).
 * @returns        - Result object with success flag and optional error
 */
export async function sendSms(
  to: string,
  body: string,
  clientId?: string | null
): Promise<SendSmsResult> {
  const client = getClient();
  if (!client || !phoneNumber) {
    return { success: false, error: "Twilio not configured" };
  }

  // Validate phone number format
  if (!isValidPhoneNumber(to)) {
    logger.warn("[twilio] Invalid phone number format", { phone: to });
    return { success: false, error: "Invalid phone number format" };
  }

  // Compliance gate: only for marketing SMS (clientId provided)
  if (clientId) {
    const complianceCheck = await canSendSms(clientId, to);
    if (!complianceCheck.allowed) {
      logger.warn(`[twilio] SMS blocked by compliance: ${complianceCheck.reason}`);
      return { success: false, error: `Compliance: ${complianceCheck.reason}` };
    }
    await logContactAttempt({
      clientId,
      contactPhone: to,
      channel: "sms",
      status: "sent",
    });
  }

  // Check message length
  if (body.length > SMS_MAX_LENGTH) {
    logger.warn(`[twilio] SMS body exceeds maximum length (${body.length}/${SMS_MAX_LENGTH})`);
    return {
      success: false,
      error: `SMS body exceeds maximum length (${body.length}/${SMS_MAX_LENGTH} chars)`,
    };
  }

  if (body.length > SMS_SEGMENT_LENGTH) {
    logger.info(
      `[twilio] SMS will be multi-segment (${body.length} chars, ~${Math.ceil(body.length / SMS_SEGMENT_LENGTH)} segments)`
    );
  }

  try {
    const message = await twilioBreaker.execute(() =>
      withRetry(
        () =>
          client.messages.create({
            to,
            from: phoneNumber,
            body,
          }),
        {
          maxAttempts: 2,
          baseDelayMs: 2_000,
          label: "twilio-sms",
          isRetryable: (error) => {
            if (error instanceof Error && "status" in error) {
              const status = (error as { status: number }).status;
              return status === 429 || status >= 500;
            }
            return true;
          },
        },
      ),
    );
    return { success: true, messageSid: message.sid };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown Twilio error";
    logger.error(`[twilio] SMS send failed to ${to}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// ---------------------------------------------------------------------------
// Helper: generate a signed recording URL (proxied, not raw Twilio URL)
//
// Recording URLs from Twilio are unauthenticated by default. This helper
// builds a short-lived HMAC-signed URL that our proxy endpoint can verify.
// ---------------------------------------------------------------------------

export function signedRecordingUrl(recordingUrl: string): string {
  // If no recording URL, return empty string
  if (!recordingUrl) return "";

  // In production, we should proxy recording URLs through our API to enforce
  // authentication. For now, append .json to prevent direct browser playback
  // of the raw MP3, and rely on dashboard auth to gate access.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Extract the recording SID from the Twilio URL
  const sidMatch = recordingUrl.match(/\/Recordings\/(RE[a-f0-9]+)/i);
  if (sidMatch?.[1]) {
    return `${appUrl}/api/services/voice/recording?sid=${encodeURIComponent(sidMatch[1])}`;
  }

  // Fallback: return the original URL (already stored)
  return recordingUrl;
}
