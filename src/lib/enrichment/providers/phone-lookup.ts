import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const TAG = "[enrichment/phone-lookup]";

export interface PhoneLookupResult {
  lineType?: string;
  verified: boolean;
}

/**
 * Look up phone number metadata using the Twilio Lookup API v2.
 * Returns line-type information (mobile, landline, voip) and verification status.
 *
 * Falls back to an unverified stub when Twilio credentials are not configured.
 */
export async function lookupPhone(
  phone: string,
): Promise<PhoneLookupResult> {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    logger.warn(`${TAG} Twilio credentials not configured — skipping phone lookup`);
    return { verified: false };
  }

  // Strip non-digit characters except leading +
  const normalized = phone.startsWith("+")
    ? "+" + phone.slice(1).replace(/\D/g, "")
    : phone.replace(/\D/g, "");

  const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(normalized)}?Fields=line_type_intelligence`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn(`${TAG} Twilio Lookup returned ${response.status}`, {
        status: response.status,
      });
      return { verified: false };
    }

    const data = await response.json();

    const lineTypeResult = data.line_type_intelligence;
    const lineType: string | undefined = lineTypeResult?.type ?? undefined;
    const valid: boolean = data.valid ?? false;

    logger.info(`${TAG} Phone lookup complete`, {
      lineType,
      valid,
    });

    return {
      lineType,
      verified: valid,
    };
  } catch (error) {
    logger.errorWithCause(`${TAG} Phone lookup failed`, error);
    return { verified: false };
  }
}
