import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const TAG = "[compliance/suppression]";

export interface AddSuppressionParams {
  clientId?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  channel: "sms" | "email" | "voice" | "all";
  reason:
    | "unsubscribe"
    | "bounce"
    | "complaint"
    | "stop"
    | "dnc"
    | "manual";
  source?: string | null;
}

/**
 * Add a contact to the suppression list.
 * At least one of contactPhone or contactEmail must be provided.
 * Idempotent — skips if an identical entry already exists.
 */
export async function addToSuppressionList(
  params: AddSuppressionParams
): Promise<void> {
  const { clientId, contactPhone, contactEmail, channel, reason, source } =
    params;

  if (!contactPhone && !contactEmail) {
    logger.warn(`${TAG} Cannot suppress — no phone or email provided`);
    return;
  }

  // Check for existing identical suppression to avoid duplicates
  const existing = await prisma.suppressionList.findFirst({
    where: {
      clientId: clientId ?? null,
      contactPhone: contactPhone ?? null,
      contactEmail: contactEmail ?? null,
      channel,
    },
    select: { id: true },
  });

  if (existing) {
    logger.info(`${TAG} Already suppressed`, {
      contactPhone,
      contactEmail,
      channel,
      reason,
    });
    return;
  }

  await prisma.suppressionList.create({
    data: {
      clientId: clientId ?? null,
      contactPhone: contactPhone ?? null,
      contactEmail: contactEmail ?? null,
      channel,
      reason,
      source: source ?? null,
    },
  });

  logger.info(`${TAG} Added to suppression list`, {
    clientId,
    contactPhone,
    contactEmail,
    channel,
    reason,
    source,
  });
}

export interface IsOnSuppressionListParams {
  clientId?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  channel: "sms" | "email" | "voice";
}

/**
 * Check if a contact is on the suppression list for a given channel.
 * Checks both client-specific and global (clientId=null) entries.
 * Also matches entries with channel "all".
 */
export async function isOnSuppressionList(
  params: IsOnSuppressionListParams
): Promise<boolean> {
  const { clientId, contactPhone, contactEmail, channel } = params;

  if (!contactPhone && !contactEmail) return false;

  // Build OR conditions: match by email or phone, for the specific channel or "all"
  const orConditions: Array<Record<string, unknown>> = [];

  if (contactEmail) {
    orConditions.push({ contactEmail, channel });
    orConditions.push({ contactEmail, channel: "all" });
  }

  if (contactPhone) {
    orConditions.push({ contactPhone, channel });
    orConditions.push({ contactPhone, channel: "all" });
  }

  // Check both client-specific and global suppressions
  const clientConditions: Array<string | null> = [null];
  if (clientId) clientConditions.push(clientId);

  const entry = await prisma.suppressionList.findFirst({
    where: {
      clientId: { in: clientConditions as string[] },
      OR: orConditions,
    },
    select: { id: true },
  });

  return entry !== null;
}

/**
 * Remove a contact from the suppression list for a specific channel.
 * Used when re-enabling a previously suppressed contact (admin action only).
 */
export async function removeFromSuppressionList(params: {
  contactEmail?: string | null;
  contactPhone?: string | null;
  channel: string;
  clientId?: string | null;
}): Promise<number> {
  const { contactEmail, contactPhone, channel, clientId } = params;

  const result = await prisma.suppressionList.deleteMany({
    where: {
      clientId: clientId ?? null,
      ...(contactEmail ? { contactEmail } : {}),
      ...(contactPhone ? { contactPhone } : {}),
      channel,
    },
  });

  if (result.count > 0) {
    logger.info(`${TAG} Removed from suppression list`, {
      contactEmail,
      contactPhone,
      channel,
      count: result.count,
    });
  }

  return result.count;
}
