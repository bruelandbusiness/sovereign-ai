import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const TAG = "[enrichment/email-finder]";

const EMAIL_VERIFICATION_THRESHOLD = Number(process.env.EMAIL_VERIFICATION_THRESHOLD) || 80;

export interface EmailFinderResult {
  email?: string;
  verified: boolean;
  source: string;
}

/**
 * Find and verify an email address for a person, optionally scoped to a
 * company domain. Uses the Hunter.io API (or compatible service).
 *
 * Returns a non-verified stub when the API key is not configured so the
 * enrichment pipeline degrades gracefully.
 */
export async function findEmail(
  name: string,
  domain?: string,
): Promise<EmailFinderResult> {
  const apiKey = env.ENRICHMENT_EMAIL_FINDER_KEY;

  if (!apiKey) {
    logger.warn(`${TAG} ENRICHMENT_EMAIL_FINDER_KEY not configured — skipping`);
    return { verified: false, source: "none" };
  }

  const baseUrl =
    process.env.ENRICHMENT_EMAIL_FINDER_URL ??
    "https://api.hunter.io/v2/email-finder";

  const url = new URL(baseUrl);
  url.searchParams.set("api_key", apiKey);

  // Split name into first/last for APIs that expect separate fields
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || "";

  url.searchParams.set("first_name", firstName);
  url.searchParams.set("last_name", lastName);

  if (domain) {
    url.searchParams.set("domain", domain);
  }

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
      logger.warn(`${TAG} API returned ${response.status}`, {
        name,
        domain,
        status: response.status,
      });
      return { verified: false, source: "hunter" };
    }

    const data = await response.json();
    const result = data.data ?? data;

    const email: string | undefined = result.email ?? undefined;
    const score: number = result.score ?? result.confidence ?? 0;
    const verified = score >= EMAIL_VERIFICATION_THRESHOLD;

    logger.info(`${TAG} Email finder complete`, {
      name,
      domain,
      found: Boolean(email),
      verified,
    });

    return {
      email,
      verified,
      source: "hunter",
    };
  } catch (error) {
    logger.errorWithCause(`${TAG} Email finder failed`, error, { name, domain });
    return { verified: false, source: "hunter" };
  }
}
