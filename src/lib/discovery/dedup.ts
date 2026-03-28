import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { RawDiscoveredLead } from "./types";

/**
 * Normalize an address for deduplication.
 * Lowercases, trims whitespace, removes unit/apt/suite variations,
 * and collapses multiple spaces.
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\b(apt|apartment|unit|ste|suite|#)\s*\.?\s*\w*/gi, "")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a phone number to digits only.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Strip leading country code "1" if 11 digits
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Normalize an email for comparison.
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Deduplicate discovered leads against existing records and within the batch.
 *
 * Matches on (in priority order):
 *   1. externalId + sourceType (exact match from same source)
 *   2. Normalized address
 *   3. Normalized phone
 *   4. Normalized email
 *
 * Returns only leads that are not already in the database and not duplicated
 * within the batch.
 */
export async function deduplicateDiscoveries(
  clientId: string,
  leads: RawDiscoveredLead[],
): Promise<RawDiscoveredLead[]> {
  if (leads.length === 0) return [];

  // Collect external IDs to check against the database
  const externalIds = leads
    .filter((l) => l.externalId)
    .map((l) => l.externalId!);

  // Collect normalized addresses to check against the database
  const normalizedAddresses = leads
    .filter((l) => l.propertyAddress)
    .map((l) => normalizeAddress(l.propertyAddress!));

  // Query existing records matching any of our dedup keys
  const existingByExternalId =
    externalIds.length > 0
      ? await prisma.discoveredLead.findMany({
          where: {
            clientId,
            externalId: { in: externalIds },
          },
          select: { externalId: true, sourceType: true },
        })
      : [];

  const existingByAddress =
    normalizedAddresses.length > 0
      ? await prisma.discoveredLead.findMany({
          where: {
            clientId,
            status: { not: "discarded" },
          },
          select: {
            propertyAddress: true,
            ownerPhone: true,
            ownerEmail: true,
          },
        })
      : [];

  // Build lookup sets from existing records
  const existingExternalKeys = new Set(
    existingByExternalId.map((r) => `${r.sourceType}:${r.externalId}`),
  );

  const existingNormalizedAddresses = new Set(
    existingByAddress
      .filter((r) => r.propertyAddress)
      .map((r) => normalizeAddress(r.propertyAddress!)),
  );

  const existingPhones = new Set(
    existingByAddress
      .filter((r) => r.ownerPhone)
      .map((r) => normalizePhone(r.ownerPhone!)),
  );

  const existingEmails = new Set(
    existingByAddress
      .filter((r) => r.ownerEmail)
      .map((r) => normalizeEmail(r.ownerEmail!)),
  );

  // Track keys seen within this batch to avoid intra-batch duplicates
  const seenExternalKeys = new Set<string>();
  const seenAddresses = new Set<string>();
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();

  const unique: RawDiscoveredLead[] = [];
  let dupCount = 0;

  for (const lead of leads) {
    let isDuplicate = false;

    // Check externalId match
    if (lead.externalId) {
      const key = `${lead.sourceType}:${lead.externalId}`;
      if (existingExternalKeys.has(key) || seenExternalKeys.has(key)) {
        isDuplicate = true;
      }
      seenExternalKeys.add(key);
    }

    // Check normalized address match
    if (!isDuplicate && lead.propertyAddress) {
      const normalized = normalizeAddress(lead.propertyAddress);
      if (
        existingNormalizedAddresses.has(normalized) ||
        seenAddresses.has(normalized)
      ) {
        isDuplicate = true;
      }
      seenAddresses.add(normalized);
    }

    // Check phone match
    if (!isDuplicate && lead.ownerPhone) {
      const normalized = normalizePhone(lead.ownerPhone);
      if (normalized.length >= 7) {
        if (existingPhones.has(normalized) || seenPhones.has(normalized)) {
          isDuplicate = true;
        }
        seenPhones.add(normalized);
      }
    }

    // Check email match
    if (!isDuplicate && lead.ownerEmail) {
      const normalized = normalizeEmail(lead.ownerEmail);
      if (existingEmails.has(normalized) || seenEmails.has(normalized)) {
        isDuplicate = true;
      }
      seenEmails.add(normalized);
    }

    if (isDuplicate) {
      dupCount++;
    } else {
      unique.push(lead);
    }
  }

  if (dupCount > 0) {
    logger.info("[discovery:dedup] Filtered duplicates", {
      clientId,
      totalInput: leads.length,
      duplicates: dupCount,
      unique: unique.length,
    });
  }

  return unique;
}
