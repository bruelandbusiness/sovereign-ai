import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBundleById } from "@/lib/constants";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { activateService } from "@/lib/services/activator";

export const dynamic = "force-dynamic";

const upgradeSchema = z.object({
  newBundleId: z.string().max(100),
  billingInterval: z.enum(["monthly", "annual"]).default("monthly"),
});

/**
 * POST /api/payments/upgrade
 * Upgrades or downgrades the current subscription to a different bundle.
 * Uses Stripe proration so the customer is charged/credited proportionally.
 *
 * Body: { newBundleId: string; billingInterval?: "monthly" | "annual" }
 * Returns: { subscription: { id, status, bundleId, monthlyAmount, currentPeriodEnd } }
 */
export async function POST(request: NextRequest) {
  // Rate limit: 5 upgrade attempts per IP per hour
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "payments-upgrade", 5);
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
  if (!session?.account?.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const parsed = upgradeSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { newBundleId, billingInterval } = parsed.data;
    const client = session.account.client;

    // Validate the new bundle
    const newBundle = getBundleById(newBundleId);
    if (!newBundle) {
      return NextResponse.json(
        { error: "Invalid bundle" },
        { status: 400 }
      );
    }

    // Get the current subscription from our database
    const dbSubscription = await prisma.subscription.findUnique({
      where: { clientId: client.id },
    });

    if (!dbSubscription?.stripeSubId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    if (dbSubscription.status === "canceled" || dbSubscription.status === "expired") {
      return NextResponse.json(
        { error: "Subscription is canceled. Use /api/payments/reactivate instead." },
        { status: 400 }
      );
    }

    // Retrieve the current Stripe subscription
    // Cast through unknown because bundler moduleResolution can lose
    // the augmented Stripe.Subscription type from the 'stripe' package.
    const rawSub = await stripe.subscriptions.retrieve(
      dbSubscription.stripeSubId
    );
    const stripeSubscription = rawSub as unknown as {
      status: string;
      current_period_end: number;
      items: { data: Array<{ id: string; price: { product: string } }> };
    };

    if (
      stripeSubscription.status === "canceled" ||
      stripeSubscription.status === "incomplete_expired"
    ) {
      return NextResponse.json(
        { error: "Stripe subscription is no longer active" },
        { status: 400 }
      );
    }

    // Calculate the new price
    const newUnitAmount =
      billingInterval === "annual"
        ? Math.round(newBundle.annualPrice * 12 * 100)
        : Math.round(newBundle.price * 100);

    if (newUnitAmount <= 0) {
      return NextResponse.json(
        { error: "Calculated amount must be positive" },
        { status: 400 }
      );
    }

    // Get the current subscription item to replace
    const currentItem = stripeSubscription.items.data[0];
    if (!currentItem) {
      return NextResponse.json(
        { error: "No subscription items found" },
        { status: 400 }
      );
    }

    // Update the subscription with the new price, using proration
    const rawUpdated = await stripe.subscriptions.update(
      dbSubscription.stripeSubId,
      {
        items: [
          {
            id: currentItem.id,
            price_data: {
              currency: "usd",
              product: currentItem.price.product,
              recurring: {
                interval: billingInterval === "annual" ? "year" : "month",
              },
              unit_amount: newUnitAmount,
            },
          },
        ],
        proration_behavior: "create_prorations",
        metadata: {
          bundle_id: newBundleId,
          services: JSON.stringify(newBundle.services),
          billing_interval: billingInterval,
        },
      }
    );
    const updatedSubscription = rawUpdated as unknown as {
      current_period_end: number;
    };

    // Update our database with the new bundle and amount
    const updatedDbSub = await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        bundleId: newBundleId,
        monthlyAmount: newUnitAmount,
        currentPeriodEnd: new Date(
          updatedSubscription.current_period_end * 1000
        ),
      },
    });

    // Update the activated services for the new bundle
    // Deactivate services not in the new bundle
    await prisma.clientService.updateMany({
      where: {
        clientId: client.id,
        status: "active",
        serviceId: { notIn: newBundle.services },
      },
      data: { status: "canceled" },
    });

    // Activate/provision services in the new bundle that aren't already active
    const existingServices = await prisma.clientService.findMany({
      where: { clientId: client.id, serviceId: { in: newBundle.services } },
      select: { serviceId: true, status: true },
    });
    const existingMap = new Map(
      existingServices.map((s) => [s.serviceId, s.status])
    );

    for (const serviceId of newBundle.services) {
      const existing = existingMap.get(serviceId);
      if (!existing) {
        // Provision and activate the new service (creates DB record + runs provisioner)
        await activateService(client.id, serviceId);
      } else if (existing === "canceled" || existing === "paused") {
        // Reactivate previously provisioned service
        await prisma.clientService.updateMany({
          where: { clientId: client.id, serviceId },
          data: { status: "active", activatedAt: new Date() },
        });
      }
    }

    // Log the plan change activity
    const oldBundleLabel = dbSubscription.bundleId || "custom";
    await prisma.activityEvent.create({
      data: {
        clientId: client.id,
        type: "lead_captured",
        title: "Plan changed",
        description: `Subscription changed from ${oldBundleLabel} to ${newBundle.name} (${billingInterval}).`,
      },
    });

    return setRateLimitHeaders(
      NextResponse.json({
        subscription: {
          id: updatedDbSub.id,
          status: updatedDbSub.status,
          bundleId: updatedDbSub.bundleId,
          monthlyAmount: updatedDbSub.monthlyAmount,
          currentPeriodEnd: updatedDbSub.currentPeriodEnd,
        },
      }),
      rl
    );
  } catch (error) {
    logger.error("Subscription upgrade error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}
