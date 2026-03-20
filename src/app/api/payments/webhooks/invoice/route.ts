import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type Stripe from "stripe";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// POST — Stripe webhook for payment link completions (Text-to-Pay)
// ---------------------------------------------------------------------------

// In-memory cache of processed Stripe event IDs to prevent duplicate processing
// on webhook retries within the same serverless instance.
const processedEvents = new Map<string, number>();
const DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cleanProcessedEvents() {
  const cutoff = Date.now() - DEDUP_TTL_MS;
  for (const [id, ts] of processedEvents) {
    if (ts < cutoff) processedEvents.delete(id);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const secret = process.env.STRIPE_INVOICE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  if (secret) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      logger.error("[invoice-webhook] Signature verification failed", { error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }
  } else if (process.env.NODE_ENV === "development") {
    logger.warn("[invoice-webhook] Webhook secret not set — skipping signature verification (dev mode)");
    event = JSON.parse(body) as Stripe.Event;
  } else {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Deduplicate: if this event ID was already processed in this instance, skip it
  cleanProcessedEvents();
  if (processedEvents.has(event.id)) {
    logger.info(`[invoice-webhook] Skipping duplicate event: ${event.id}`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        payment_link?: string;
        metadata?: Record<string, string>;
        amount_total?: number;
      };

      const paymentLinkId = session.payment_link;
      if (!paymentLinkId) {
        return NextResponse.json({ received: true });
      }

      // Find the invoice by Stripe Payment Link ID
      const invoice = await prisma.invoice.findFirst({
        where: { stripePaymentLinkId: paymentLinkId },
        include: {
          client: {
            select: { id: true, accountId: true, businessName: true },
          },
        },
      });

      if (!invoice) {
        logger.warn("[invoice-webhook] No invoice found for payment link", { paymentLinkId });
        return NextResponse.json({ received: true });
      }

      // Idempotency guard: skip if the invoice is already paid (Stripe retry)
      if (invoice.status === "paid") {
        logger.info(`[invoice-webhook] Invoice ${invoice.id} already paid, skipping`);
        return NextResponse.json({ received: true, duplicate: true });
      }

      // Wrap all DB writes in a transaction so they succeed or fail atomically
      await prisma.$transaction(async (tx) => {
        // Update invoice to paid
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "paid",
            paidAt: new Date(),
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            accountId: invoice.client.accountId,
            type: "billing",
            title: "Payment received",
            message: `${invoice.customerName} paid $${(invoice.amount / 100).toFixed(2)} for "${invoice.description}".`,
            actionUrl: "/dashboard/invoices",
          },
        });

        // Create activity event
        await tx.activityEvent.create({
          data: {
            clientId: invoice.clientId,
            type: "lead_captured",
            title: "Payment received",
            description: `${invoice.customerName} paid $${(invoice.amount / 100).toFixed(2)} for "${invoice.description}".`,
          },
        });

        // Track revenue attribution event
        await tx.revenueEvent.create({
          data: {
            clientId: invoice.clientId,
            invoiceId: invoice.id,
            channel: "organic",
            eventType: "payment_received",
            amount: invoice.amount,
            metadata: JSON.stringify({
              paymentLinkId,
              customerName: invoice.customerName,
            }),
          },
        });
      });
    }

    // Mark event as processed after successful handling
    processedEvents.set(event.id, Date.now());
  } catch (error) {
    logger.error("[invoice-webhook] Error processing event", { error: error instanceof Error ? error.message : String(error) });
    // Return 500 so Stripe retries on transient failures. The event-ID dedup
    // guard and the already-paid check prevent double-processing on retries.
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
