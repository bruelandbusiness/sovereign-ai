import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/subscriptions
 * Returns the current user's subscription details, including data
 * synced from Stripe for real-time accuracy.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "subscriptions-get", 60);
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
    const client = session.account.client;
    if (!client) {
      return NextResponse.json({ subscription: null });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { clientId: client.id },
    });

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    // If we have a Stripe subscription ID, fetch latest status from Stripe
    let stripeData: {
      status: string;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      trialEnd: string | null;
    } | null = null;

    if (subscription.stripeSubId) {
      try {
        assertStripeConfigured();
        const rawSub = await stripe.subscriptions.retrieve(
          subscription.stripeSubId
        );
        // Cast through unknown because bundler moduleResolution can lose
        // the augmented Stripe.Subscription type from the 'stripe' package.
        const stripeSub = rawSub as unknown as {
          status: string;
          current_period_end: number | null;
          cancel_at_period_end: boolean;
          trial_end: number | null;
        };
        stripeData = {
          status: stripeSub.status,
          currentPeriodEnd: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : null,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          trialEnd: stripeSub.trial_end
            ? new Date(stripeSub.trial_end * 1000).toISOString()
            : null,
        };
      } catch (err) {
        // If Stripe call fails, fall back to cached DB data
        logger.error("Failed to fetch Stripe subscription", {
          error: err instanceof Error ? err.message : String(err),
          stripeSubId: subscription.stripeSubId,
        });
      }
    }

    // Get active services
    const services = await prisma.clientService.findMany({
      where: { clientId: client.id },
      select: { serviceId: true, status: true, activatedAt: true },
    });

    const res = setRateLimitHeaders(NextResponse.json({
      subscription: {
        id: subscription.id,
        bundleId: subscription.bundleId,
        status: subscription.status,
        monthlyAmount: subscription.monthlyAmount,
        isTrial: subscription.isTrial,
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
        createdAt: subscription.createdAt.toISOString(),
        // Live Stripe data (null if unavailable)
        stripe: stripeData,
      },
      services: services.map((s) => ({
        serviceId: s.serviceId,
        status: s.status,
        activatedAt: s.activatedAt?.toISOString() || null,
      })),
    }), rl);
    res.headers.set("Cache-Control", "private, max-age=30");
    return res;
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Subscription fetch error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
