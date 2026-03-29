import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const TAG = "[compliance/consent]";

export interface RecordConsentParams {
  clientId: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  channel: "sms" | "email" | "voice";
  consentType: "express_written" | "opt_in" | "implied";
  consentSource: "form" | "chatbot" | "api" | "manual" | "discovery";
  consentText?: string | null;
  ipAddress?: string | null;
}

/**
 * Record consent for a contact to be contacted on a specific channel.
 * Returns the consent record ID.
 * Idempotent — if valid consent already exists, returns the existing ID.
 */
export async function recordConsent(
  params: RecordConsentParams
): Promise<string> {
  const {
    clientId,
    contactPhone,
    contactEmail,
    channel,
    consentType,
    consentSource,
    consentText,
    ipAddress,
  } = params;

  if (!contactPhone && !contactEmail) {
    throw new Error("At least one of contactPhone or contactEmail is required");
  }

  // Check for existing active consent
  const existing = await prisma.consentRecord.findFirst({
    where: {
      clientId,
      channel,
      revokedAt: null,
      ...(contactPhone ? { contactPhone } : {}),
      ...(contactEmail ? { contactEmail } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    logger.info(`${TAG} Valid consent already exists`, {
      consentId: existing.id,
      clientId,
      channel,
    });
    return existing.id;
  }

  const record = await prisma.consentRecord.create({
    data: {
      clientId,
      contactPhone: contactPhone ?? null,
      contactEmail: contactEmail ?? null,
      channel,
      consentType,
      consentSource,
      consentText: consentText ?? null,
      ipAddress: ipAddress ?? null,
    },
  });

  logger.info(`${TAG} Consent recorded`, {
    consentId: record.id,
    clientId,
    channel,
    consentType,
    consentSource,
  });

  return record.id;
}

/**
 * Revoke consent for a contact on a specific channel.
 * Sets revokedAt on all matching active consent records.
 */
export async function revokeConsent(
  clientId: string,
  channel: "sms" | "email" | "voice",
  contactIdentifier: string
): Promise<number> {
  const isEmail = contactIdentifier.includes("@");
  const where = {
    clientId,
    channel,
    revokedAt: null,
    ...(isEmail
      ? { contactEmail: contactIdentifier }
      : { contactPhone: contactIdentifier }),
  };

  const result = await prisma.consentRecord.updateMany({
    where,
    data: { revokedAt: new Date() },
  });

  if (result.count > 0) {
    logger.info(`${TAG} Consent revoked`, {
      clientId,
      channel,
      contactIdentifier,
      revokedCount: result.count,
    });
  }

  return result.count;
}

/**
 * Check if a contact has valid (non-revoked) consent for a channel.
 */
export async function hasValidConsent(
  clientId: string,
  channel: "sms" | "email" | "voice",
  contactIdentifier: string
): Promise<boolean> {
  const isEmail = contactIdentifier.includes("@");
  const where = {
    clientId,
    channel,
    revokedAt: null,
    ...(isEmail
      ? { contactEmail: contactIdentifier }
      : { contactPhone: contactIdentifier }),
  };

  const record = await prisma.consentRecord.findFirst({
    where,
    select: { id: true },
  });

  return record !== null;
}
