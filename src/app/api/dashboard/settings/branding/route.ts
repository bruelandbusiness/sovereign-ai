import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrandingSettings {
  logoUrl: string | null;
  brandColor: string;
  accentColor: string;
  companyName: string;
  customDomain: string;
  emailFooter: string;
  showPoweredBy: boolean;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: null,
  brandColor: "#4C85FF",
  accentColor: "#10B981",
  companyName: "",
  customDomain: "",
  emailFooter: "",
  showPoweredBy: true,
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const brandingSchema = z.object({
  logoUrl: z.string().max(500_000).nullable().optional(),
  brandColor: z.string().regex(HEX_COLOR, "Invalid hex color").optional(),
  accentColor: z.string().regex(HEX_COLOR, "Invalid hex color").optional(),
  companyName: z.string().max(200).optional(),
  customDomain: z.string().max(253).optional(),
  emailFooter: z.string().max(500).optional(),
  showPoweredBy: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseBranding(onboardingData: string | null): BrandingSettings {
  if (!onboardingData) return { ...DEFAULT_BRANDING };
  try {
    const parsed = JSON.parse(onboardingData);
    const b = parsed?.branding;
    if (!b || typeof b !== "object") return { ...DEFAULT_BRANDING };

    return {
      logoUrl:
        typeof b.logoUrl === "string" ? b.logoUrl : DEFAULT_BRANDING.logoUrl,
      brandColor:
        typeof b.brandColor === "string" && HEX_COLOR.test(b.brandColor)
          ? b.brandColor
          : DEFAULT_BRANDING.brandColor,
      accentColor:
        typeof b.accentColor === "string" && HEX_COLOR.test(b.accentColor)
          ? b.accentColor
          : DEFAULT_BRANDING.accentColor,
      companyName:
        typeof b.companyName === "string"
          ? b.companyName
          : DEFAULT_BRANDING.companyName,
      customDomain:
        typeof b.customDomain === "string"
          ? b.customDomain
          : DEFAULT_BRANDING.customDomain,
      emailFooter:
        typeof b.emailFooter === "string"
          ? b.emailFooter
          : DEFAULT_BRANDING.emailFooter,
      showPoweredBy:
        typeof b.showPoweredBy === "boolean"
          ? b.showPoweredBy
          : DEFAULT_BRANDING.showPoweredBy,
    };
  } catch {
    return { ...DEFAULT_BRANDING };
  }
}

async function saveBranding(
  clientId: string,
  currentOnboardingData: string | null,
  branding: BrandingSettings,
): Promise<void> {
  let existing: Record<string, unknown> = {};
  if (currentOnboardingData) {
    try {
      existing = JSON.parse(currentOnboardingData);
    } catch {
      existing = {};
    }
  }
  const updated = { ...existing, branding };
  await prisma.client.update({
    where: { id: clientId },
    data: { onboardingData: JSON.stringify(updated) },
  });
}

// ---------------------------------------------------------------------------
// GET -- returns current branding settings
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
        { status: 404 },
      );
    }

    const branding = parseBranding(client.onboardingData);

    return NextResponse.json({ branding });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    Sentry.captureException(error);
    logger.errorWithCause("[settings/branding] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch branding settings" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT -- updates branding settings
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "settings-branding-put", 20);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      ),
      rl,
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
          { status: 400 },
        ),
        rl,
      );
    }

    const parsed = brandingSchema.safeParse(rawBody);
    if (!parsed.success) {
      return setRateLimitHeaders(
        NextResponse.json(
          {
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 },
        ),
        rl,
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { onboardingData: true },
    });

    if (!client) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Client not found" },
          { status: 404 },
        ),
        rl,
      );
    }

    const current = parseBranding(client.onboardingData);
    const updated: BrandingSettings = {
      logoUrl:
        parsed.data.logoUrl !== undefined
          ? parsed.data.logoUrl
          : current.logoUrl,
      brandColor: parsed.data.brandColor ?? current.brandColor,
      accentColor: parsed.data.accentColor ?? current.accentColor,
      companyName: parsed.data.companyName ?? current.companyName,
      customDomain: parsed.data.customDomain ?? current.customDomain,
      emailFooter: parsed.data.emailFooter ?? current.emailFooter,
      showPoweredBy:
        parsed.data.showPoweredBy !== undefined
          ? parsed.data.showPoweredBy
          : current.showPoweredBy,
    };

    await saveBranding(clientId, client.onboardingData, updated);

    return setRateLimitHeaders(
      NextResponse.json({ ok: true, branding: updated }),
      rl,
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    Sentry.captureException(error);
    logger.errorWithCause("[settings/branding] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update branding settings" },
      { status: 500 },
    );
  }
}
