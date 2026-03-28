import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationRecord {
  id: string;
  connected: boolean;
  apiKey?: string;
  connectedAt?: string;
}

type IntegrationMap = Record<string, IntegrationRecord>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const KNOWN_INTEGRATIONS = [
  "google-business-profile",
  "google-ads",
  "meta-facebook-ads",
  "servicetitan",
  "jobber",
  "housecall-pro",
  "quickbooks",
  "stripe",
] as const;

const API_KEY_PREFIX_MAP: Record<string, string> = {
  stripe: "sk_",
};

const API_KEY_MIN_LENGTH: Record<string, number> = {
  stripe: 20,
  "google-ads": 10,
  "google-business-profile": 10,
  "meta-facebook-ads": 10,
  servicetitan: 10,
  jobber: 10,
  "housecall-pro": 10,
  quickbooks: 10,
};

const connectSchema = z.object({
  integrationId: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(500).optional(),
});

const testSchema = z.object({
  integrationId: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(500),
});

const disconnectSchema = z.object({
  integrationId: z.string().min(1).max(100),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseIntegrations(onboardingData: string | null): IntegrationMap {
  if (!onboardingData) return {};
  try {
    const parsed = JSON.parse(onboardingData);
    const integrations = parsed?.integrations;
    if (!integrations || typeof integrations !== "object") return {};
    return integrations as IntegrationMap;
  } catch {
    return {};
  }
}

async function saveIntegrations(
  clientId: string,
  currentOnboardingData: string | null,
  integrations: IntegrationMap
): Promise<void> {
  let existing: Record<string, unknown> = {};
  if (currentOnboardingData) {
    try {
      existing = JSON.parse(currentOnboardingData);
    } catch {
      existing = {};
    }
  }
  const updated = { ...existing, integrations };
  await prisma.client.update({
    where: { id: clientId },
    data: { onboardingData: JSON.stringify(updated) },
  });
}

function validateApiKeyFormat(
  integrationId: string,
  apiKey: string
): string | null {
  if (apiKey.length < 5) {
    return "API key must be at least 5 characters";
  }

  const minLen = API_KEY_MIN_LENGTH[integrationId];
  if (minLen && apiKey.length < minLen) {
    return `API key for ${integrationId} must be at least ${minLen} characters`;
  }

  const prefix = API_KEY_PREFIX_MAP[integrationId];
  if (prefix && !apiKey.startsWith(prefix)) {
    return `API key for ${integrationId} must start with "${prefix}"`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// GET — list integrations with connection status
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { onboardingData: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const integrations = parseIntegrations(client.onboardingData);

    // Return connection status for every known integration
    const result = KNOWN_INTEGRATIONS.map((id) => {
      const record = integrations[id];
      return {
        id,
        connected: record?.connected ?? false,
        hasApiKey: Boolean(record?.apiKey),
        connectedAt: record?.connectedAt ?? null,
      };
    });

    return NextResponse.json({ integrations: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.errorWithCause(
      "[settings/integrations] GET failed:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — connect an integration (save API key + mark connected)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rl = await rateLimitByIP(ip, "settings-integrations-post", 30);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      ),
      rl
    );
  }

  try {
    const { clientId } = await requireClient();

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        ),
        rl
      );
    }

    // Check if this is a test-connection request
    const url = new URL(request.url);
    const isTest = url.searchParams.get("action") === "test";

    if (isTest) {
      const parsed = testSchema.safeParse(rawBody);
      if (!parsed.success) {
        return setRateLimitHeaders(
          NextResponse.json(
            {
              error: "Validation failed",
              details: parsed.error.flatten().fieldErrors,
            },
            { status: 400 }
          ),
          rl
        );
      }

      const validationError = validateApiKeyFormat(
        parsed.data.integrationId,
        parsed.data.apiKey
      );
      if (validationError) {
        return setRateLimitHeaders(
          NextResponse.json(
            { error: validationError, valid: false },
            { status: 400 }
          ),
          rl
        );
      }

      return setRateLimitHeaders(
        NextResponse.json({
          valid: true,
          message: "API key format is valid",
        }),
        rl
      );
    }

    const parsed = connectSchema.safeParse(rawBody);
    if (!parsed.success) {
      return setRateLimitHeaders(
        NextResponse.json(
          {
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        ),
        rl
      );
    }

    const { integrationId, apiKey } = parsed.data;

    // Validate API key format if provided
    if (apiKey) {
      const validationError = validateApiKeyFormat(integrationId, apiKey);
      if (validationError) {
        return setRateLimitHeaders(
          NextResponse.json(
            { error: validationError },
            { status: 400 }
          ),
          rl
        );
      }
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { onboardingData: true },
    });

    if (!client) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        ),
        rl
      );
    }

    const integrations = parseIntegrations(client.onboardingData);
    integrations[integrationId] = {
      id: integrationId,
      connected: true,
      apiKey: apiKey ?? undefined,
      connectedAt: new Date().toISOString(),
    };

    await saveIntegrations(
      clientId,
      client.onboardingData,
      integrations
    );

    return setRateLimitHeaders(
      NextResponse.json({
        ok: true,
        integration: {
          id: integrationId,
          connected: true,
          hasApiKey: Boolean(apiKey),
          connectedAt: integrations[integrationId].connectedAt,
        },
      }),
      rl
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.errorWithCause(
      "[settings/integrations] POST failed:",
      error
    );
    return NextResponse.json(
      { error: "Failed to save integration" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — disconnect an integration
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rl = await rateLimitByIP(ip, "settings-integrations-delete", 20);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      ),
      rl
    );
  }

  try {
    const { clientId } = await requireClient();

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        ),
        rl
      );
    }

    const parsed = disconnectSchema.safeParse(rawBody);
    if (!parsed.success) {
      return setRateLimitHeaders(
        NextResponse.json(
          {
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        ),
        rl
      );
    }

    const { integrationId } = parsed.data;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { onboardingData: true },
    });

    if (!client) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        ),
        rl
      );
    }

    const integrations = parseIntegrations(client.onboardingData);
    delete integrations[integrationId];

    await saveIntegrations(
      clientId,
      client.onboardingData,
      integrations
    );

    return setRateLimitHeaders(
      NextResponse.json({ ok: true }),
      rl
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.errorWithCause(
      "[settings/integrations] DELETE failed:",
      error
    );
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
