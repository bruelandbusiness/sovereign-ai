import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBundleById, getServiceById } from "@/lib/constants";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  bundleId: z.string().max(100).optional(),
  services: z.array(z.string().max(100)).max(20).optional(),
  billingInterval: z.enum(["monthly", "annual"]).default("monthly"),
  onboardingData: z.record(z.string(), z.unknown()).optional(),
  referralCode: z.string().max(50).optional(),
});

/**
 * POST /api/payments/checkout
 * Creates a Stripe Checkout Session for a new subscription.
 *
 * Body: { bundleId?: string; services?: string[]; billingInterval?: "monthly" | "annual"; onboardingData?: Record<string, unknown> }
 * Returns: { url: string; sessionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 checkout attempts per IP per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimitByIP(ip, "payments-checkout", 10);
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

    assertStripeConfigured();

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = checkoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { bundleId, services, billingInterval, onboardingData, referralCode } = parsed.data;
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

    // Determine price and product name server-side
    let unitAmount = 0; // cents
    let productName = "Sovereign AI Services";
    const resolvedBundleId = bundleId || null;
    let serviceIds: string[] = [];

    if (bundleId) {
      const bundle = getBundleById(bundleId);
      if (!bundle) {
        return NextResponse.json(
          { error: "Invalid bundle" },
          { status: 400 }
        );
      }
      // For annual billing, Stripe charges per interval; use annualPrice * 12 for yearly total
      unitAmount =
        billingInterval === "annual"
          ? Math.round(bundle.annualPrice * 12 * 100)
          : Math.round(bundle.price * 100);
      productName = `Sovereign AI ${bundle.name} Bundle`;
      serviceIds = bundle.services;
    } else if (Array.isArray(services) && services.length > 0) {
      for (const serviceId of services) {
        const service = getServiceById(serviceId);
        if (!service) {
          return NextResponse.json(
            { error: `Invalid service: ${serviceId}` },
            { status: 400 }
          );
        }
        unitAmount += Math.round(service.price * 100);
      }
      serviceIds = services;
      productName =
        services.length === 1
          ? `Sovereign AI - ${getServiceById(services[0])!.name}`
          : `Sovereign AI - ${services.length} Services`;
    } else {
      return NextResponse.json(
        { error: "No bundle or services specified" },
        { status: 400 }
      );
    }

    if (unitAmount <= 0) {
      return NextResponse.json(
        { error: "Calculated amount must be positive" },
        { status: 400 }
      );
    }

    // Check if the user already has a client record with a Stripe customer ID
    const account = session.account;
    const client = account.client;
    let stripeCustomerId: string | undefined;

    if (client) {
      const existingSub = await prisma.subscription.findUnique({
        where: { clientId: client.id },
      });
      stripeCustomerId = existingSub?.stripeCustId || undefined;
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      subscription_data: {
        trial_period_days: 14,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName },
            recurring: {
              interval: billingInterval === "annual" ? "year" : "month",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bundle_id: resolvedBundleId || "",
        services: JSON.stringify(serviceIds),
        billing_interval: billingInterval,
        email: account.email,
        customer_name: account.name || "",
        business_name: client?.businessName || "",
        // Stripe metadata values have a 500-char limit; truncate to stay safe
        onboarding_data: onboardingData
          ? JSON.stringify(onboardingData).slice(0, 500)
          : "",
        referral_code: referralCode || "",
      },
      success_url: `${appUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=canceled`,
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: account.email }),
    });

    return setRateLimitHeaders(
      NextResponse.json({
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      }),
      rl
    );
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Checkout session creation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
