import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const TAG = "[enrichment/reverse-address]";

export interface ReverseAddressResult {
  ownerName?: string;
  mailingAddress?: string;
}

/**
 * Look up property owner information by street address using a configurable
 * reverse-address API (e.g. Melissa, Smarty, ATTOM).
 *
 * Returns an empty object when the API key is not configured so that the
 * enrichment pipeline degrades gracefully.
 */
export async function lookupAddress(
  address: string,
): Promise<ReverseAddressResult> {
  const apiKey = env.ENRICHMENT_REVERSE_ADDRESS_KEY;

  if (!apiKey) {
    logger.warn(`${TAG} ENRICHMENT_REVERSE_ADDRESS_KEY not configured — skipping`);
    return {};
  }

  const baseUrl =
    process.env.ENRICHMENT_REVERSE_ADDRESS_URL ??
    "https://api.melissa.com/v3/WEB/PropertyLookup";

  const url = new URL(baseUrl);
  url.searchParams.set("id", apiKey);
  url.searchParams.set("ff", address);
  url.searchParams.set("format", "json");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn(`${TAG} API returned ${response.status} for address lookup`, {
        address,
        status: response.status,
      });
      return {};
    }

    const data = await response.json();

    const ownerName =
      data.Records?.[0]?.OwnerName ??
      data.ownerName ??
      data.owner_name ??
      undefined;

    const mailingAddress =
      data.Records?.[0]?.MailingAddress ??
      data.mailingAddress ??
      data.mailing_address ??
      undefined;

    logger.info(`${TAG} Address lookup complete`, {
      address,
      found: Boolean(ownerName || mailingAddress),
    });

    return { ownerName, mailingAddress };
  } catch (error) {
    logger.errorWithCause(`${TAG} Address lookup failed`, error, { address });
    return {};
  }
}
