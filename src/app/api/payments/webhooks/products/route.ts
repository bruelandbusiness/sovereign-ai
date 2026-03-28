import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { escapeHtml } from "@/lib/email";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Database-backed idempotency using AuditLog table.
// The previous in-memory Map was unreliable in serverless environments where
// each invocation may run in a fresh instance. Database-backed dedup works
// across all instances and survives cold starts.
// ---------------------------------------------------------------------------

async function isProductEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: { resource: "stripe_product_webhook", resourceId: eventId },
  });
  return !!existing;
}

async function markProductEventProcessed(eventId: string, eventType: string) {
  await prisma.auditLog.create({
    data: {
      action: "webhook_processed",
      resource: "stripe_product_webhook",
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

    let event: Stripe.Event;

    const productWebhookSecret = process.env.STRIPE_PRODUCT_WEBHOOK_SECRET;
    if (!productWebhookSecret) {
      logger.error("STRIPE_PRODUCT_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        productWebhookSecret
      );
    } catch (err) {
      logger.error("Product webhook signature verification failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Database-backed idempotency: works across serverless instances
    if (await isProductEventProcessed(event.id)) {
      logger.info("Skipping duplicate product webhook event", { eventId: event.id });
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only handle digital product purchases
      if (session.metadata?.type !== "digital_product") {
        return NextResponse.json({ received: true });
      }

      await handleProductPurchase(session);
    }

    // Mark event as processed after successful handling (database-backed)
    try {
      await markProductEventProcessed(event.id, event.type);
    } catch {
      // Unique constraint violation means a concurrent request already processed
      // this event — safe to ignore (idempotency working as intended).
      logger.info("[product-webhook] Event already marked processed (concurrent delivery)", {
        eventId: event.id,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Log the error but return 200 to prevent Stripe from retrying.
    // The database-backed idempotency guard and the productPurchase unique
    // constraint prevent double-processing. Returning 500 causes Stripe to
    // retry up to ~16 times over 3 days, flooding logs.
    logger.error("Product webhook error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ received: true, error: "processing_failed" });
  }
}

async function handleProductPurchase(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const productId = metadata.product_id;
  const accountId = metadata.account_id;

  if (!productId || !accountId) {
    logger.error("Missing product_id or account_id in session metadata", { sessionId: session.id });
    return;
  }

  // Check if purchase already exists (idempotency)
  const existing = await prisma.productPurchase.findUnique({
    where: {
      productId_accountId: {
        productId,
        accountId,
      },
    },
  });

  if (existing) {
    logger.info("Purchase already exists", { productId, accountId });
    return;
  }

  // Get the product for delivery info
  const product = await prisma.digitalProduct.findUnique({
    where: { id: productId },
  });

  if (!product) {
    logger.error("Product not found", { productId });
    return;
  }

  // Validate amount — must be positive to prevent $0 / negative purchases
  const purchaseAmount = session.amount_total || product.price;
  if (purchaseAmount <= 0) {
    logger.error("Product purchase amount is zero or negative", {
      productId,
      amount: purchaseAmount,
      sessionId: session.id,
    });
    return;
  }

  // Wrap all DB writes in a transaction for atomicity
  await prisma.$transaction(async (tx) => {
    await tx.productPurchase.create({
      data: {
        productId,
        accountId,
        stripeSessionId: session.id,
        amount: purchaseAmount,
        status: "completed",
        accessUrl: product.deliveryUrl,
      },
    });

    await tx.digitalProduct.update({
      where: { id: productId },
      data: {
        salesCount: { increment: 1 },
      },
    });

    await tx.notification.create({
      data: {
        accountId,
        type: "system",
        title: "Purchase Confirmed!",
        message: `Your purchase of "${product.name}" is complete. Visit your product library to access your download.`,
        actionUrl: "/dashboard",
      },
    });
  });

  // Send confirmation email
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (account) {
    try {
      // Dynamic import to avoid circular dependencies
      const { queueEmail } = await import("@/lib/email-queue");
      await queueEmail(
        account.email,
        `Your purchase: ${product.name}`,
        buildPurchaseConfirmationEmail(
          account.name || "there",
          product.name,
          product.deliveryType,
          product.deliveryNotes || ""
        )
      );
    } catch (emailErr) {
      logger.error("Failed to queue purchase confirmation email", { error: emailErr instanceof Error ? emailErr.message : String(emailErr) });
      // Don't fail the webhook for email errors
    }
  }
}

function buildPurchaseConfirmationEmail(
  name: string,
  productName: string,
  deliveryType: string,
  deliveryNotes: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #111; font-size: 24px; margin-bottom: 8px;">Purchase Confirmed!</h1>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Hey ${escapeHtml(name)}, thanks for your purchase of <strong>${escapeHtml(productName)}</strong>.
      </p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="color: #333; font-size: 14px; margin: 0 0 8px 0;"><strong>Delivery Type:</strong> ${escapeHtml(deliveryType)}</p>
        ${deliveryNotes ? `<p style="color: #333; font-size: 14px; margin: 0;"><strong>Notes:</strong> ${escapeHtml(deliveryNotes)}</p>` : ""}
      </div>
      <a href="${appUrl}/products/library" style="display: inline-block; background: #4c85ff; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Access Your Product Library
      </a>
      <p style="color: #999; font-size: 13px; margin-top: 32px;">
        If you have any questions, reply to this email or contact our support team.
      </p>
    </div>
  `;
}
