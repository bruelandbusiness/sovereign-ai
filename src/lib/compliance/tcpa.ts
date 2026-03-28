import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { addToSuppressionList } from "./suppression";
import { revokeConsent } from "./consent";

const TAG = "[compliance/tcpa]";

/** STOP words that must immediately suppress a contact (case-insensitive). */
const STOP_KEYWORDS = ["stop", "unsubscribe", "cancel", "end", "quit"] as const;

/**
 * Check if a contact has prior express written consent for SMS/voice on a given channel.
 * TCPA requires consent before any automated SMS or call to a mobile number.
 */
export async function checkTCPAConsent(
  clientId: string,
  phone: string
): Promise<boolean> {
  const record = await prisma.consentRecord.findFirst({
    where: {
      clientId,
      contactPhone: phone,
      channel: { in: ["sms", "voice"] },
      revokedAt: null,
    },
    select: { id: true },
  });

  return record !== null;
}

/**
 * Check if the current time falls within quiet hours for the given timezone.
 * TCPA prohibits automated SMS/calls before 8 AM or after 9 PM recipient local time.
 *
 * @param timezone - IANA timezone (e.g., "America/Chicago")
 * @param startHour - Earliest allowed hour (default 8)
 * @param endHour - Latest allowed hour (default 21 = 9 PM)
 * @returns true if currently in quiet hours (sending NOT allowed)
 */
export function isQuietHours(
  timezone: string,
  startHour: number = 8,
  endHour: number = 21
): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const currentHour = parseInt(formatter.format(now), 10);

    // Quiet hours: before startHour or at/after endHour
    return currentHour < startHour || currentHour >= endHour;
  } catch {
    // If timezone is invalid, default to blocking (safe side)
    logger.warn(`${TAG} Invalid timezone "${timezone}" — defaulting to quiet hours`);
    return true;
  }
}

/**
 * Check if a contact has exceeded the maximum contact attempts within the cooldown period.
 * After maxAttempts, the contact enters a cooldown for cooldownDays.
 *
 * @returns true if the contact is in cooldown (sending NOT allowed)
 */
export async function isInContactCooldown(
  clientId: string,
  contactIdentifier: string,
  channel: "sms" | "email" | "voice",
  maxAttempts: number = 3,
  cooldownDays: number = 30
): Promise<boolean> {
  const isEmail = contactIdentifier.includes("@");
  const cooldownStart = new Date();
  cooldownStart.setDate(cooldownStart.getDate() - cooldownDays);

  const attemptCount = await prisma.contactAttemptLog.count({
    where: {
      clientId,
      channel,
      status: "sent",
      createdAt: { gte: cooldownStart },
      ...(isEmail
        ? { contactEmail: contactIdentifier }
        : { contactPhone: contactIdentifier }),
    },
  });

  return attemptCount >= maxAttempts;
}

/**
 * Process an inbound message for STOP/unsubscribe keywords.
 * If a stop keyword is detected:
 * 1. Add to suppression list with reason "stop"
 * 2. Revoke any active consent
 *
 * @returns true if a STOP keyword was detected and processed
 */
export async function processStopKeyword(
  clientId: string,
  fromPhone: string,
  messageBody: string
): Promise<boolean> {
  const normalized = messageBody.trim().toLowerCase();

  const isStop = STOP_KEYWORDS.some(
    (keyword) => normalized === keyword || normalized.startsWith(`${keyword} `)
  );

  if (!isStop) return false;

  logger.info(`${TAG} STOP keyword detected`, {
    clientId,
    fromPhone,
    keyword: normalized,
  });

  // Add to suppression list
  await addToSuppressionList({
    clientId,
    contactPhone: fromPhone,
    channel: "sms",
    reason: "stop",
    source: "inbound_sms",
  });

  // Also suppress voice — STOP typically means all automated contact
  await addToSuppressionList({
    clientId,
    contactPhone: fromPhone,
    channel: "voice",
    reason: "stop",
    source: "inbound_sms",
  });

  // Revoke consent for both channels
  await revokeConsent(clientId, "sms", fromPhone);
  await revokeConsent(clientId, "voice", fromPhone);

  return true;
}

/**
 * Log a contact attempt (successful or blocked).
 */
export async function logContactAttempt(params: {
  clientId: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  channel: "sms" | "email" | "voice";
  status: "sent" | "blocked" | "failed";
  blockReason?: string | null;
}): Promise<void> {
  await prisma.contactAttemptLog.create({
    data: {
      clientId: params.clientId,
      contactPhone: params.contactPhone ?? null,
      contactEmail: params.contactEmail ?? null,
      channel: params.channel,
      status: params.status,
      blockReason: params.blockReason ?? null,
    },
  });
}
