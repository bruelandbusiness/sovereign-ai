/**
 * Lead Enrichment Orchestrator
 *
 * Runs enrichment providers in sequence (reverse address -> email finder ->
 * phone lookup -> social match), creating or updating an EnrichmentRecord.
 * Providers that are not configured are skipped gracefully.
 *
 * Each enrichment category supports a fallback chain: if the primary provider
 * fails or returns no results, the next provider in the chain is tried. The
 * provider that ultimately succeeded is tracked in the enrichment record.
 *
 * Rate-limited responses (HTTP 429) trigger exponential backoff before
 * retrying the same provider.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { lookupAddress } from "./providers/reverse-address";
import { findEmail } from "./providers/email-finder";
import { lookupPhone } from "./providers/phone-lookup";
import { findSocialProfiles, type SocialProfiles } from "./providers/social-match";

const TAG = "[enrichment]";

// ---------------------------------------------------------------------------
// Fallback chain infrastructure
// ---------------------------------------------------------------------------

/** Indicates the provider was rate-limited (HTTP 429). */
class RateLimitError extends Error {
  constructor(providerName: string) {
    super(`${providerName} rate-limited (429)`);
    this.name = "RateLimitError";
  }
}

/**
 * Wait for `ms` milliseconds. Extracted for testability.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Maximum number of backoff retries for a single provider call. */
const MAX_BACKOFF_RETRIES = 3;

/** Base delay in ms for exponential backoff (doubles each retry). */
const BACKOFF_BASE_MS = 500;

/**
 * Execute a single provider function with exponential backoff for
 * rate-limit (429) errors. Non-429 errors propagate immediately.
 */
async function callWithBackoff<T>(
  providerName: string,
  fn: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_BACKOFF_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isRateLimit =
        error instanceof RateLimitError ||
        (error instanceof Error && error.message.includes("429"));

      if (!isRateLimit || attempt === MAX_BACKOFF_RETRIES) {
        throw error;
      }

      const waitMs = BACKOFF_BASE_MS * Math.pow(2, attempt);
      logger.warn(`${TAG} ${providerName} rate-limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_BACKOFF_RETRIES})`, {
        provider: providerName,
        attempt: attempt + 1,
        waitMs,
      });
      await delay(waitMs);
    }
  }
  // Unreachable in practice, but satisfies the type checker
  throw lastError;
}

interface FallbackResult<T> {
  data: T;
  provider: string;
}

/**
 * Run through a list of provider functions in priority order. Returns the
 * result from the first provider that succeeds and returns data (determined
 * by `hasData`). If a provider succeeds but has no data, it is recorded as
 * a "no data" result and the next provider is tried.
 *
 * Every provider attempt is logged so failures are visible for debugging.
 */
async function runFallbackChain<T>(
  categoryName: string,
  providers: ReadonlyArray<{
    readonly name: string;
    readonly fn: () => Promise<T>;
  }>,
  hasData: (result: T) => boolean,
  providerResults: ProviderResult[],
): Promise<FallbackResult<T> | null> {
  for (const { name, fn } of providers) {
    try {
      const result = await callWithBackoff(name, fn);
      const gotData = hasData(result);
      providerResults.push({ name, succeeded: true, hasData: gotData });

      if (gotData) {
        return { data: result, provider: name };
      }

      logger.info(`${TAG} ${name} succeeded but returned no data, trying next provider`, {
        category: categoryName,
        provider: name,
      });
    } catch (error) {
      logger.errorWithCause(`${TAG} ${name} provider failed`, error, {
        category: categoryName,
        provider: name,
      });
      providerResults.push({ name, succeeded: false, hasData: false });
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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

  // 1. Reverse Address Lookup (single provider, no fallback chain needed)
  let ownerName: string | undefined;
  let mailingAddress: string | undefined;

  if (input.address) {
    const addressChain = [
      {
        name: "reverse_address",
        fn: () => lookupAddress(input.address!),
      },
    ] as const;

    const addressResult = await runFallbackChain(
      "reverse_address",
      addressChain,
      (r) => Boolean(r.ownerName || r.mailingAddress),
      results,
    );

    if (addressResult) {
      ownerName = addressResult.data.ownerName;
      mailingAddress = addressResult.data.mailingAddress;
    }
  }

  // 2. Email Finder — fallback chain: Hunter -> Clearbit -> RocketReach
  //    Each fallback re-uses the same `findEmail` function but the provider
  //    itself can be swapped via env config. The chain here demonstrates the
  //    pattern; additional provider implementations can be added to the
  //    providers/ directory and wired in below.
  let emailFound: string | undefined;
  let emailVerified = false;
  let emailSource: string | undefined;

  const nameForLookup = ownerName ?? input.name;
  if (nameForLookup) {
    const emailChain = [
      {
        name: "email_finder",
        fn: () => findEmail(nameForLookup),
      },
      // Fallback providers can be added here, e.g.:
      // { name: "email_finder_clearbit", fn: () => findEmailClearbit(nameForLookup) },
      // { name: "email_finder_rocketreach", fn: () => findEmailRocketReach(nameForLookup) },
    ] as const;

    const emailResult = await runFallbackChain(
      "email_finder",
      emailChain,
      (r) => Boolean(r.email),
      results,
    );

    if (emailResult) {
      emailFound = emailResult.data.email;
      emailVerified = emailResult.data.verified;
      emailSource = emailResult.data.source;
    } else {
      // All providers failed or returned no data — capture defaults for
      // partial-success tracking. If the chain had at least one success
      // (no data), the result is already recorded in `results`.
      // If all threw, those failures are recorded too.
    }
  }

  // 3. Phone Lookup — single provider with backoff
  let phoneLineType: string | undefined;
  let phoneVerified = false;

  const phoneForLookup = input.phone;
  if (phoneForLookup) {
    const phoneChain = [
      {
        name: "phone_lookup",
        fn: () => lookupPhone(phoneForLookup),
      },
    ] as const;

    const phoneResult = await runFallbackChain(
      "phone_lookup",
      phoneChain,
      (r) => Boolean(r.lineType) || r.verified,
      results,
    );

    if (phoneResult) {
      phoneLineType = phoneResult.data.lineType;
      phoneVerified = phoneResult.data.verified;
    }
  }

  // 4. Social Match — fallback chain for social providers
  let socialProfiles: SocialProfiles = {};

  if (nameForLookup) {
    const socialChain = [
      {
        name: "social_match",
        fn: () => findSocialProfiles(nameForLookup),
      },
      // Fallback providers can be added here, e.g.:
      // { name: "social_match_pipl", fn: () => findSocialPipl(nameForLookup) },
    ] as const;

    const socialResult = await runFallbackChain(
      "social_match",
      socialChain,
      (r) => Object.keys(r).length > 0,
      results,
    );

    if (socialResult) {
      socialProfiles = socialResult.data;
    }
  }

  // Determine final status — support "partial" when some data was found
  // but not all categories succeeded.
  const attempted = results.length;
  const succeeded = results.filter((r) => r.succeeded).length;
  const withData = results.filter((r) => r.hasData).length;
  const failed = results.filter((r) => !r.succeeded).length;

  let status: string;
  if (attempted === 0) {
    status = "failed";
  } else if (withData > 0 && failed > 0) {
    // Some data found but at least one provider failed — partial success
    status = "partial";
  } else if (withData > 0 && succeeded === attempted) {
    status = "complete";
  } else if (withData > 0) {
    // Data found but some providers returned no data (not failures)
    status = "complete";
  } else if (succeeded > 0) {
    // All succeeded but none had data
    status = "complete";
  } else {
    status = "failed";
  }

  // Build the list of providers that contributed data
  const succeededProviders = results
    .filter((r) => r.succeeded && r.hasData)
    .map((r) => r.name);

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
        succeededProviders,
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
    providersFailed: failed,
    succeededProviders,
  });

  return updated;
}
