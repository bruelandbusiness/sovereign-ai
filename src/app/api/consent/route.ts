import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies, headers } from "next/headers";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

const CONSENT_COOKIE = "sovereign-cookie-consent";
const CONSENT_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

const consentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
  functional: z.boolean(),
});

export type CookieConsent = z.infer<typeof consentSchema>;

/**
 * GET /api/consent
 *
 * Returns the current cookie consent preferences from the cookie.
 * Works for both authenticated and unauthenticated users.
 */
export async function GET() {
  try {
    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "consent-get", 60);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const cookieStore = await cookies();
    const raw = cookieStore.get(CONSENT_COOKIE)?.value;

    if (!raw) {
      return NextResponse.json({ consent: null });
    }

    let consent: unknown;
    try {
      consent = JSON.parse(raw);
    } catch {
      return NextResponse.json({ consent: null });
    }

    const parsed = consentSchema.safeParse(consent);
    if (!parsed.success) {
      return NextResponse.json({ consent: null });
    }

    return NextResponse.json({ consent: parsed.data });
  } catch (error) {
    logger.errorWithCause("[consent] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to retrieve consent preferences" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/consent
 *
 * Saves cookie consent preferences. Stores them in a cookie so they
 * persist for both authenticated and unauthenticated visitors.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "consent-post", 30);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = consentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Provide { analytics: boolean, marketing: boolean, functional: boolean }.",
        },
        { status: 400 },
      );
    }

    const consent = parsed.data;
    const cookieStore = await cookies();

    cookieStore.set(CONSENT_COOKIE, JSON.stringify(consent), {
      httpOnly: false, // Client JS needs to read consent state
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CONSENT_MAX_AGE,
    });

    logger.info("[consent] Cookie preferences saved", {
      analytics: consent.analytics,
      marketing: consent.marketing,
      functional: consent.functional,
    });

    return NextResponse.json({
      success: true,
      consent,
    });
  } catch (error) {
    logger.errorWithCause("[consent] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to save consent preferences" },
      { status: 500 },
    );
  }
}
