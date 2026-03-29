import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/portal
 * Creates a Stripe Billing Portal session so the customer can manage their
 * subscription, update payment methods, view invoices, and cancel.
 *
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 portal requests per IP per hour
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "payments-portal", 10);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      ),
      rl
    );
  }

  const session = await getSession();
  if (!session?.account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertStripeConfigured();

    const client = session.account.client;
    if (!client) {
      return NextResponse.json(
        { error: "No client profile found" },
        { status: 404 }
      );
    }

    // Look up the subscription to get the Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { clientId: client.id },
    });

    if (!subscription?.stripeCustId) {
      return NextResponse.json(
        { error: "No Stripe customer found. You may not have an active subscription." },
        { status: 404 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Validate appUrl to prevent open-redirect via misconfiguration
    try {
      new URL(appUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid application URL configuration" },
        { status: 500 }
      );
    }

    // billingPortal is on the Stripe instance but bundler moduleResolution
    // occasionally fails to pick up the augmented declaration. Runtime is fine.
    const portal = (stripe as unknown as { billingPortal: { sessions: { create: (params: { customer: string; return_url: string }) => Promise<{ url: string }> } } }).billingPortal;
    const portalSession = await portal.sessions.create({
      customer: subscription.stripeCustId,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return setRateLimitHeaders(NextResponse.json({ url: portalSession.url }), rl);
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Portal session creation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
