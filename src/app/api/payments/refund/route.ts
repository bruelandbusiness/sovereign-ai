import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { requireStripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { createNotificationForClient } from "@/lib/notifications";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const refundSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  reason: z.string().min(1, "reason is required").max(500),
  amount: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/payments/refund — Create a refund for a client
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  // Rate limit: 5 refund requests per hour per IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "payments-refund", 5);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      ),
      rl,
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = refundSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { clientId, reason, amount } = parsed.data;

  try {
    const stripe = requireStripe();

    // Look up the client's active subscription and Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { clientId },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found for this client" },
        { status: 404 },
      );
    }

    if (!subscription.stripeCustId) {
      return NextResponse.json(
        { error: "No Stripe customer ID associated with this client" },
        { status: 400 },
      );
    }

    // Find the latest paid invoice from Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustId,
      status: "paid",
      limit: 1,
    });

    if (invoices.data.length === 0) {
      return NextResponse.json(
        { error: "No paid invoices found for this client" },
        { status: 404 },
      );
    }

    const invoice = invoices.data[0];

    if (!invoice.payment_intent) {
      return NextResponse.json(
        { error: "No payment intent found on latest invoice" },
        { status: 400 },
      );
    }

    // Build refund params
    const paymentIntentId =
      typeof invoice.payment_intent === "string"
        ? invoice.payment_intent
        : invoice.payment_intent.id;

    const refundParams: {
      payment_intent: string;
      reason: "requested_by_customer";
      amount?: number;
    } = {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
    };

    if (amount !== undefined) {
      const amountInCents = Math.round(amount * 100);
      refundParams.amount = amountInCents;
    }

    const refund = await stripe.refunds.create(refundParams);

    // Determine the display amount for the notification
    const refundedAmountDisplay =
      amount !== undefined
        ? `$${amount.toFixed(2)}`
        : `$${((refund.amount ?? 0) / 100).toFixed(2)}`;

    // Log to audit log
    await logAudit({
      accountId,
      action: "refund_created",
      resource: "payment",
      resourceId: refund.id,
      metadata: {
        clientId,
        reason,
        amount: refundedAmountDisplay,
        stripeRefundId: refund.id,
        paymentIntent: paymentIntentId,
      },
    });

    // Create notification for the client
    await createNotificationForClient(clientId, {
      type: "billing",
      title: "Refund Processed",
      message: `Refund of ${refundedAmountDisplay} processed`,
      actionUrl: "/dashboard/billing",
    });

    return setRateLimitHeaders(NextResponse.json({ refund }), rl);
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Refund creation error", {
      error: error instanceof Error ? error.message : String(error),
      clientId,
    });
    return NextResponse.json(
      { error: "Failed to create refund" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/payments/refund — List refunds for a client
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const stripe = requireStripe();

    // Look up the client's Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { clientId },
    });

    if (!subscription?.stripeCustId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this client" },
        { status: 404 },
      );
    }

    // Fetch all charges for the customer, then list refunds
    const charges = await stripe.charges.list({
      customer: subscription.stripeCustId,
      limit: 100,
    });

    const refunds: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string | null;
      created: number;
      chargeId: string;
    }> = [];

    for (const charge of charges.data) {
      if (charge.refunds && charge.refunds.data.length > 0) {
        for (const refund of charge.refunds.data) {
          refunds.push({
            id: refund.id,
            amount: refund.amount,
            currency: refund.currency,
            status: refund.status,
            created: refund.created,
            chargeId: charge.id,
          });
        }
      }
    }

    return NextResponse.json({ refunds });
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Refund list error", {
      error: error instanceof Error ? error.message : String(error),
      clientId,
    });
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 },
    );
  }
}
