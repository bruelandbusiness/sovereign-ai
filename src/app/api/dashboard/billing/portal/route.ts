import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/dashboard/billing/portal
 * Creates a Stripe Billing Portal session for the authenticated client.
 * Calls Stripe directly rather than proxying through an external service.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 portal session requests per IP per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "billing-portal", 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const session = await getSession();
    if (!session?.account.client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { clientId: session.account.client.id },
      select: { stripeCustId: true },
    });

    if (!subscription?.stripeCustId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 },
      );
    }

    assertStripeConfigured();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Validate appUrl to prevent open-redirect via misconfiguration
    try {
      new URL(appUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid application URL configuration" },
        { status: 500 },
      );
    }

    // billingPortal is on the Stripe instance but bundler moduleResolution
    // occasionally fails to pick up the augmented declaration. Runtime is fine.
    const portal = (stripe as unknown as { billingPortal: { sessions: { create: (params: { customer: string; return_url: string }) => Promise<{ url: string }> } } }).billingPortal;
    const portalSession = await portal.sessions.create({
      customer: subscription.stripeCustId,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Dashboard billing portal session error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}
