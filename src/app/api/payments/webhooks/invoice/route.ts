import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type Stripe from "stripe";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// POST — Stripe webhook for payment link completions (Text-to-Pay)
// ---------------------------------------------------------------------------

/**
 * Database-backed idempotency using AuditLog table.
 * Works across serverless instances — prevents duplicate processing
 * even when multiple Vercel functions handle the same event.
 */
async function isInvoiceEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: { resource: "stripe_invoice_webhook", resourceId: eventId },
  });
  return !!existing;
}

async function markInvoiceEventProcessed(eventId: string, eventType: string) {
  await prisma.auditLog.create({
    data: {
      action: "webhook_processed",
      resource: "stripe_invoice_webhook",
      resourceId: eventId,
      metadata: JSON.stringify({ eventType, processedAt: new Date().toISOString() }),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const secret = process.env.STRIPE_INVOICE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      logger.error("[invoice-webhook] Webhook secret not configured (STRIPE_INVOICE_WEBHOOK_SECRET / STRIPE_WEBHOOK_SECRET)");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    assertStripeConfigured();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      logger.error("[invoice-webhook] Signature verification failed", { error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Database-backed idempotency: works across serverless instances
    if (await isInvoiceEventProcessed(event.id)) {
      logger.info(`[invoice-webhook] Skipping duplicate event: ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }
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

    // Mark event as processed after successful handling (database-backed)
    try {
      await markInvoiceEventProcessed(event.id, event.type);
    } catch {
      // Unique constraint violation means a concurrent request already processed
      // this event — safe to ignore (idempotency working as intended).
      logger.info("[invoice-webhook] Event already marked processed (concurrent delivery)", {
        eventId: event.id,
      });
    }
  } catch (error) {
    // Log the error but return 200 to prevent Stripe from retrying.
    // The database-backed idempotency guard and the already-paid check
    // protect against double-processing, but returning 500 causes Stripe
    // to retry up to ~16 times over 3 days — flooding logs and creating
    // race conditions. If the event wasn't marked as processed, Stripe's
    // normal delivery mechanism will re-send it naturally.
    Sentry.captureException(error);
    logger.error("[invoice-webhook] Error processing event", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ received: true, error: "processing_failed" });
  }

  return NextResponse.json({ received: true });
}
