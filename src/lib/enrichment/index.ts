/**
 * Lead Enrichment Orchestrator
 *
 * Runs enrichment providers in sequence (reverse address -> email finder ->
 * phone lookup -> social match), creating or updating an EnrichmentRecord.
 * Providers that are not configured are skipped gracefully.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { lookupAddress } from "./providers/reverse-address";
import { findEmail } from "./providers/email-finder";
import { lookupPhone } from "./providers/phone-lookup";
import { findSocialProfiles, type SocialProfiles } from "./providers/social-match";

const TAG = "[enrichment]";

interface ProviderResult {
  name: string;
  succeeded: boolean;
  hasData: boolean;
}

/**
 * Enrich a standard Lead by its ID.
 */
export async function enrichLead(
  clientId: string,
  leadId: string,
) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, clientId },
  });

  if (!lead) {
    throw new Error(`Lead ${leadId} not found for client ${clientId}`);
  }

  return runEnrichment({
    clientId,
    leadId,
    discoveredLeadId: null,
    name: lead.name,
    phone: lead.phone ?? undefined,
  });
}

/**
 * Enrich a DiscoveredLead by its ID.
 */
export async function enrichDiscoveredLead(
  clientId: string,
  discoveredLeadId: string,
) {
  const dl = await prisma.discoveredLead.findFirst({
    where: { id: discoveredLeadId, clientId },
  });

  if (!dl) {
    throw new Error(
      `DiscoveredLead ${discoveredLeadId} not found for client ${clientId}`,
    );
  }

  return runEnrichment({
    clientId,
    leadId: null,
    discoveredLeadId,
    address: dl.propertyAddress ?? undefined,
    name: dl.ownerName ?? undefined,
    phone: dl.ownerPhone ?? undefined,
  });
}

// ---------------------------------------------------------------------------
// Core orchestration
// ---------------------------------------------------------------------------

interface EnrichmentInput {
  clientId: string;
  leadId: string | null;
  discoveredLeadId: string | null;
  address?: string;
  name?: string;
  phone?: string;
}

async function runEnrichment(input: EnrichmentInput) {
  const { clientId, leadId, discoveredLeadId } = input;

  logger.info(`${TAG} Starting enrichment`, {
    clientId,
    leadId,
    discoveredLeadId,
  });

  // Upsert the enrichment record
  const existing = await prisma.enrichmentRecord.findFirst({
    where: {
      clientId,
      ...(leadId ? { leadId } : {}),
      ...(discoveredLeadId ? { discoveredLeadId } : {}),
    },
  });

  const recordId = existing?.id;

  const record = recordId
    ? await prisma.enrichmentRecord.update({
        where: { id: recordId },
        data: { status: "enriching", addressInput: input.address ?? null },
      })
    : await prisma.enrichmentRecord.create({
        data: {
          clientId,
          leadId,
          discoveredLeadId,
          status: "enriching",
          addressInput: input.address ?? null,
        },
      });

  const results: ProviderResult[] = [];

  // 1. Reverse Address Lookup
  let ownerName: string | undefined;
  let mailingAddress: string | undefined;

  if (input.address) {
    try {
      const addressResult = await lookupAddress(input.address);
      ownerName = addressResult.ownerName;
      mailingAddress = addressResult.mailingAddress;
      const hasData = Boolean(ownerName || mailingAddress);
      results.push({ name: "reverse_address", succeeded: true, hasData });
    } catch (error) {
      logger.errorWithCause(`${TAG} reverse_address provider failed`, error);
      results.push({ name: "reverse_address", succeeded: false, hasData: false });
    }
  }

  // 2. Email Finder
  let emailFound: string | undefined;
  let emailVerified = false;
  let emailSource: string | undefined;

  const nameForLookup = ownerName ?? input.name;
  if (nameForLookup) {
    try {
      const emailResult = await findEmail(nameForLookup);
      emailFound = emailResult.email;
      emailVerified = emailResult.verified;
      emailSource = emailResult.source;
      const hasData = Boolean(emailFound);
      results.push({ name: "email_finder", succeeded: true, hasData });
    } catch (error) {
      logger.errorWithCause(`${TAG} email_finder provider failed`, error);
      results.push({ name: "email_finder", succeeded: false, hasData: false });
    }
  }

  // 3. Phone Lookup
  let phoneLineType: string | undefined;
  let phoneVerified = false;

  const phoneForLookup = input.phone;
  if (phoneForLookup) {
    try {
      const phoneResult = await lookupPhone(phoneForLookup);
      phoneLineType = phoneResult.lineType;
      phoneVerified = phoneResult.verified;
      const hasData = Boolean(phoneLineType) || phoneVerified;
      results.push({ name: "phone_lookup", succeeded: true, hasData });
    } catch (error) {
      logger.errorWithCause(`${TAG} phone_lookup provider failed`, error);
      results.push({ name: "phone_lookup", succeeded: false, hasData: false });
    }
  }

  // 4. Social Match
  let socialProfiles: SocialProfiles = {};

  if (nameForLookup) {
    try {
      socialProfiles = await findSocialProfiles(nameForLookup);
      const hasData = Object.keys(socialProfiles).length > 0;
      results.push({ name: "social_match", succeeded: true, hasData });
    } catch (error) {
      logger.errorWithCause(`${TAG} social_match provider failed`, error);
      results.push({ name: "social_match", succeeded: false, hasData: false });
    }
  }

  // Determine final status
  const attempted = results.length;
  const succeeded = results.filter((r) => r.succeeded).length;
  const withData = results.filter((r) => r.hasData).length;

  let status: string;
  if (attempted === 0) {
    status = "failed";
  } else if (withData > 0 && succeeded === attempted) {
    status = "complete";
  } else if (withData > 0) {
    status = "partial";
  } else if (succeeded > 0) {
    status = "complete";
  } else {
    status = "failed";
  }

  // Persist enrichment data
  const updated = await prisma.enrichmentRecord.update({
    where: { id: record.id },
    data: {
      status,
      ownerName: ownerName ?? null,
      mailingAddress: mailingAddress ?? null,
      emailFound: emailFound ?? null,
      emailVerified,
      emailSource: emailSource ?? null,
      phoneFound: phoneForLookup ?? null,
      phoneLineType: phoneLineType ?? null,
      phoneVerified,
      socialProfiles:
        Object.keys(socialProfiles).length > 0
          ? JSON.stringify(socialProfiles)
          : null,
      enrichedAt: new Date(),
      rawData: JSON.stringify({
        providers: results,
        timestamp: new Date().toISOString(),
      }),
    },
  });

  logger.info(`${TAG} Enrichment complete`, {
    recordId: updated.id,
    status,
    providersAttempted: attempted,
    providersSucceeded: succeeded,
    providersWithData: withData,
  });

  return updated;
}
