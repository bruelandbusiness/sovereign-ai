import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBundleById, getServiceById } from "@/lib/constants";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const reactivateSchema = z.object({
  bundleId: z.string().max(100).optional(),
  services: z.array(z.string().max(100)).max(20).optional(),
  billingInterval: z.enum(["monthly", "annual"]).optional(),
});

/**
 * POST /api/payments/reactivate
 * Creates a new Stripe checkout session for a previously-canceled customer,
 * allowing them to reactivate their subscription.
 *
 * Body: { bundleId?: string; services?: string[]; billingInterval?: "monthly" | "annual" }
 *
 * On successful Stripe checkout, the existing webhook handler will
 * reactivate the subscription and re-enable services.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 reactivation attempts per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimitByIP(ip, "payments-reactivate", 10);
    if (!rl.allowed) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        ),
        rl
      );
    }

    assertStripeConfigured();

    const session = await getSession();
    if (!session?.account?.client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = session.account.client;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = reactivateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { bundleId, services, billingInterval } = parsed.data;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Validate appUrl is a proper URL to prevent open-redirect via misconfiguration
    try {
      new URL(appUrl);
    } catch {
      return NextResponse.json({ error: "Invalid application URL configuration" }, { status: 500 });
    }

    // Look up the subscription and verify it is actually canceled/expired
    const subscription = await prisma.subscription.findUnique({
      where: { clientId: client.id },
    });

    if (subscription && !["canceled", "expired"].includes(subscription.status)) {
      return NextResponse.json(
        { error: "Subscription is not canceled — cannot reactivate" },
        { status: 400 }
      );
    }

    // Calculate price server-side
    // All arithmetic uses Math.round() to eliminate floating-point cent errors
    let amount = 0; // cents
    let productName = "Sovereign AI Services";

    if (bundleId) {
      const bundle = getBundleById(bundleId);
      if (!bundle) {
        return NextResponse.json({ error: "Invalid bundle" }, { status: 400 });
      }
      // annualPrice is the discounted monthly rate; Stripe needs the full yearly total
      amount = billingInterval === "annual"
        ? Math.round(bundle.annualPrice * 12 * 100)
        : Math.round(bundle.price * 100);
      productName = `Sovereign AI ${bundleId.charAt(0).toUpperCase() + bundleId.slice(1)} Bundle`;
    } else if (Array.isArray(services) && services.length > 0) {
      for (const serviceId of services) {
        const service = getServiceById(serviceId);
        if (!service) {
          return NextResponse.json(
            { error: `Invalid service: ${serviceId}` },
            { status: 400 }
          );
        }
        amount += Math.round(service.price * 100);
      }
    } else {
      return NextResponse.json(
        { error: "No bundle or services specified" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Calculated amount must be positive" }, { status: 400 });
    }

    // Re-use existing Stripe customer ID if available
    const customerEmail = session.account.email;
    const stripeCustomerId = subscription?.stripeCustId || undefined;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName },
            recurring: { interval: billingInterval === "annual" ? "year" : "month" },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bundle_id: bundleId || "",
        services: JSON.stringify(services || []),
        billingInterval: billingInterval || "monthly",
        reactivation: "true",
        client_id: client.id,
        email: customerEmail,
      },
      success_url: `${appUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}&reactivated=true`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=canceled`,
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail }),
    });

    return setRateLimitHeaders(
      NextResponse.json({
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      }),
      rl
    );
  } catch (error) {
    logger.error("Reactivation checkout error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create reactivation checkout" },
      { status: 500 }
    );
  }
}
