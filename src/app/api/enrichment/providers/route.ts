import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Map of enrichment provider names to the env var that activates them.
 */
const PROVIDER_ENV_MAP: Record<string, string> = {
  reverse_address: "ENRICHMENT_REVERSE_ADDRESS_KEY",
  email_finder: "ENRICHMENT_EMAIL_FINDER_KEY",
  phone_lookup: "TWILIO_ACCOUNT_SID",
  social_match: "ENRICHMENT_SOCIAL_MATCH_KEY",
};

/**
 * GET /api/enrichment/providers
 * List configured enrichment providers and their status.
 */
export async function GET() {
  try {
    await requireClient();

    // Fetch provider records from database (if any have been seeded)
    const dbProviders = await prisma.enrichmentProvider.findMany({
      select: {
        name: true,
        provider: true,
        isActive: true,
        rateLimit: true,
        costPerCall: true,
      },
    });

    const providers = Object.entries(PROVIDER_ENV_MAP).map(
      ([name, envVar]) => {
        const dbRecord = dbProviders.find((p) => p.name === name);
        const configured = Boolean(
          (env as unknown as Record<string, string>)[envVar],
        );

        return {
          name,
          provider: dbRecord?.provider ?? name,
          isActive: dbRecord?.isActive ?? true,
          configured,
          // Do not expose internal env var names to the client
          rateLimit: dbRecord?.rateLimit ?? 100,
          costPerCall: dbRecord?.costPerCall ?? 0,
        };
      },
    );

    return NextResponse.json({ providers });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause("[api/enrichment/providers] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch enrichment providers" },
      { status: 500 },
    );
  }
}
