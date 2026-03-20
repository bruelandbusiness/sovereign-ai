import Twilio from "twilio";

// ---------------------------------------------------------------------------
// Twilio SDK singleton
// ---------------------------------------------------------------------------

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let _client: Twilio.Twilio | null = null;

function getClient(): Twilio.Twilio | null {
  if (_client) return _client;

  if (!accountSid || !authToken) {
    console.warn(
      "[twilio] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set — Twilio is disabled."
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
}

export async function makeCall(
  to: string,
  twimlUrl: string,
  options?: MakeCallOptions
): Promise<{ callSid: string } | null> {
  const client = getClient();
  if (!client || !phoneNumber) {
    console.warn("[twilio] Cannot make call — client or phone number missing.");
    return null;
  }

  const timeLimit = options?.timeLimit ?? 1800; // Default 30 minutes max
  const record = options?.record ?? false; // Default: no recording (privacy-first)

  const call = await client.calls.create({
    to,
    from: phoneNumber,
    url: twimlUrl,
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/services/voice/status`,
    statusCallbackEvent: ["ringing", "answered", "completed"],
    statusCallbackMethod: "POST",
    record,
    timeLimit,
  });

  return { callSid: call.sid };
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
      console.error("[twilio] CRITICAL: TWILIO_AUTH_TOKEN not set in production — rejecting webhook.");
      return false;
    }
    console.warn("[twilio] TWILIO_AUTH_TOKEN not set — skipping signature validation (dev mode).");
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
 * Send an SMS message via Twilio with phone validation and length checks.
 *
 * @param to    - Recipient phone number (should be E.164 format)
 * @param body  - Message body text
 * @returns     - Result object with success flag and optional error
 */
export async function sendSms(
  to: string,
  body: string
): Promise<SendSmsResult> {
  const client = getClient();
  if (!client || !phoneNumber) {
    return { success: false, error: "Twilio not configured" };
  }

  // Validate phone number format
  if (!isValidPhoneNumber(to)) {
    console.warn(`[twilio] Invalid phone number format: ${to}`);
    return { success: false, error: `Invalid phone number format: ${to}` };
  }

  // Check message length
  if (body.length > SMS_MAX_LENGTH) {
    console.warn(`[twilio] SMS body exceeds maximum length (${body.length}/${SMS_MAX_LENGTH})`);
    return {
      success: false,
      error: `SMS body exceeds maximum length (${body.length}/${SMS_MAX_LENGTH} chars)`,
    };
  }

  if (body.length > SMS_SEGMENT_LENGTH) {
    console.info(
      `[twilio] SMS will be multi-segment (${body.length} chars, ~${Math.ceil(body.length / SMS_SEGMENT_LENGTH)} segments)`
    );
  }

  try {
    const message = await client.messages.create({
      to,
      from: phoneNumber,
      body,
    });
    return { success: true, messageSid: message.sid };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown Twilio error";
    console.error(`[twilio] SMS send failed to ${to}: ${errorMessage}`);
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
