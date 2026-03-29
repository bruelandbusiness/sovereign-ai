import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { createAccountWithMagicLink } from "@/lib/auth";
import { sendWelcomeEmail, sendEmailQueued, emailLayout, emailButton } from "@/lib/email";
import { activateServices } from "@/lib/services/activator";
import { logger } from "@/lib/logger";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { trackReferralConversion } from "@/lib/referral-tracker";
import { sendTelegramAlert } from "@/lib/telegram";
import { warnOnInvalidTransition } from "@/lib/subscription-state";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

// ─── Typed subsets of Stripe objects for webhook event data ─────────────

interface CheckoutSession {
  id: string;
  customer?: string | { id: string } | null;
  customer_email?: string | null;
  metadata?: Record<string, string> | null;
  subscription?: string | { id: string } | null;
  amount_total?: number | null;
}

interface SubscriptionObject {
  id: string;
  customer?: string | { id: string } | null;
  status?: string;
  current_period_end?: number;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string> | null;
  items?: { data: Array<{ price: { unit_amount: number | null } }> };
}

interface InvoiceObject {
  id: string;
  customer?: string | { id: string } | null;
  subscription?: string | { id: string } | null;
  amount_paid?: number;
  billing_reason?: string | null;
  period_start?: number;
  period_end?: number;
}

interface DisputeObject {
  id: string;
  charge?: string | null;
  customer?: string | { id: string } | null;
  amount?: number;
  currency?: string;
  status?: string;
  reason?: string | null;
  metadata?: Record<string, string> | null;
}

function resolveId(field: string | { id: string } | null | undefined): string | null {
  if (!field) return null;
  if (typeof field === "string") return field;
  return field.id;
}

// ─── Idempotency ────────────────────────────────────────────────────────

/**
 * Database-backed idempotency using AuditLog table.
 * Works across serverless instances — prevents duplicate processing
 * even when multiple Vercel functions handle the same event.
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: { resource: "stripe_webhook", resourceId: eventId },
    select: { id: true },
  });
  return !!existing;
}

async function markEventProcessed(eventId: string, eventType: string) {
  await prisma.auditLog.create({
    data: {
      action: "webhook_processed",
      resource: "stripe_webhook",
      resourceId: eventId,
      metadata: JSON.stringify({ eventType, processedAt: new Date().toISOString() }),
    },
  });
}

// ─── Main handler ───────────────────────────────────────────────────────

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

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("[payments/webhooks/stripe] STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    assertStripeConfigured();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.errorWithCause("[payments/webhooks/stripe] Signature verification failed", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Idempotency: skip already-processed events (database-backed for serverless)
    if (await isEventProcessed(event.id)) {
      logger.info("[payments/webhooks/stripe] Duplicate event skipped", {
        eventId: event.id,
        eventType: event.type,
      });
      return NextResponse.json({ received: true, deduplicated: true });
    }

    logger.info("[payments/webhooks/stripe] Processing event", {
      eventId: event.id,
      eventType: event.type,
    });

    const obj = event.data.object;

    // Dispatch to handler. If the handler throws, we decide whether to
    // return 500 (so Stripe retries) based on whether the event is critical.
    // Critical events (checkout, payment_failed) must succeed — data loss
    // on these means lost revenue or missed dunning. Non-critical events
    // (activity logs, status updates) are safe to absorb and alert on.
    const CRITICAL_EVENTS = new Set([
      "checkout.session.completed",
      "customer.subscription.deleted",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
      "charge.dispute.created",
    ]);

    let handlerError: unknown = null;

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(obj as unknown as CheckoutSession);
          break;
        case "customer.subscription.created":
          // Subscription creation is handled via checkout.session.completed,
          // but log the event for audit completeness.
          logger.info("[payments/webhooks/stripe] subscription.created received", {
            subscriptionId: (obj as unknown as SubscriptionObject).id,
          });
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(obj as unknown as SubscriptionObject);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(obj as unknown as SubscriptionObject);
          break;
        case "customer.subscription.paused":
          await handleSubscriptionPaused(obj as unknown as SubscriptionObject);
          break;
        case "customer.subscription.resumed":
          await handleSubscriptionResumed(obj as unknown as SubscriptionObject);
          break;
        case "invoice.payment_succeeded":
          await handleInvoicePaymentSucceeded(obj as unknown as InvoiceObject);
          break;
        case "invoice.payment_failed":
          await handlePaymentFailed(obj as unknown as InvoiceObject);
          break;
        case "invoice.paid":
          await handleInvoicePaid(obj as unknown as InvoiceObject);
          break;
        case "charge.dispute.created":
          await handleDisputeCreated(obj as unknown as DisputeObject);
          break;
        case "charge.dispute.closed":
          await handleDisputeClosed(obj as unknown as DisputeObject);
          break;
        default:
          logger.info(`[payments/webhooks/stripe] Unhandled event type: ${event.type}`);
          break;
      }
    } catch (err) {
      handlerError = err;
      Sentry.captureException(err);
      logger.errorWithCause(
        `[payments/webhooks/stripe] Handler failed for ${event.type}`,
        err,
        { eventId: event.id },
      );
    }

    // If the handler failed on a critical event, return 500 so Stripe retries.
    // Do NOT mark the event as processed — the retry should re-attempt it.
    if (handlerError && CRITICAL_EVENTS.has(event.type)) {
      return NextResponse.json(
        { error: "handler_failed", eventType: event.type },
        { status: 500 },
      );
    }

    // For successful processing (or non-critical failures), mark as processed.
    try {
      await markEventProcessed(event.id, event.type);
    } catch {
      // Unique constraint violation means a concurrent request already processed
      // this event — safe to ignore (idempotency working as intended).
      logger.info("[payments/webhooks/stripe] Event already marked processed (concurrent delivery)", {
        eventId: event.id,
      });
    }

    // Return 200 for successful processing or absorbed non-critical failures.
    if (handlerError) {
      return NextResponse.json({ received: true, error: "non_critical_handler_failed" });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // Unexpected error outside handler dispatch (e.g. idempotency DB check
    // failed, assertStripeConfigured threw). Return 500 so Stripe retries.
    Sentry.captureException(error);
    logger.errorWithCause("[payments/webhooks/stripe] Webhook infrastructure error", error);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}

// ─── checkout.session.completed ────────────────────────────────────────

async function handleCheckoutCompleted(session: CheckoutSession) {
  const email = session.customer_email || session.metadata?.email;
  if (!email) {
    logger.error("[payments/webhooks/stripe] No email in checkout session", { sessionId: session.id });
    return;
  }

  const metadata = session.metadata || {};
  const ownerName = metadata.customer_name || "";
  const businessName = metadata.business_name || "";
  const agencyId = metadata.agency_id || null;
  let serviceIds: string[] = [];
  try {
    serviceIds = metadata.services ? JSON.parse(metadata.services) : [];
  } catch {
    logger.error("[payments/webhooks/stripe] Failed to parse services metadata", {
      sessionId: session.id,
      raw: metadata.services,
    });
  }
  const bundleId = metadata.bundle_id || null;

  // 1. Create account with magic link
  const authResult = await createAccountWithMagicLink(email, ownerName);

  // 2. Create client profile
  let onboardingData: Record<string, unknown> = {};
  try {
    if (metadata.onboarding_data) {
      onboardingData = JSON.parse(metadata.onboarding_data);
    }
  } catch {
    logger.warn("[payments/webhooks/stripe] Failed to parse onboarding_data metadata", {
      sessionId: session.id,
    });
  }

  const step1 = (onboardingData.step1 || {}) as Record<string, string>;

  const client = await prisma.client.upsert({
    where: { accountId: authResult.account.id },
    create: {
      accountId: authResult.account.id,
      agencyId: agencyId || null,
      businessName: businessName || step1.businessName || "My Business",
      ownerName: ownerName || step1.ownerName || "",
      phone: step1.phone || null,
      city: step1.city || null,
      state: step1.state || null,
      vertical: step1.industry || null,
      website: step1.website || null,
      serviceAreaRadius: step1.serviceAreaRadius || null,
      onboardingData: JSON.stringify(onboardingData),
    },
    update: {
      agencyId: agencyId || undefined,
      businessName: businessName || step1.businessName || undefined,
      onboardingData: JSON.stringify(onboardingData),
    },
  });

  // 3. Determine trial status from the Stripe subscription
  let isTrial = false;
  let trialEndsAt: Date | null = null;
  const subscriptionId = resolveId(session.subscription);

  if (subscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
      if ((stripeSub as unknown as SubscriptionObject).status === "trialing") {
        const trialEnd = (stripeSub as unknown as SubscriptionObject).trial_end;
        if (trialEnd) {
          isTrial = true;
          trialEndsAt = new Date(trialEnd * 1000);
        }
      }
    } catch (err) {
      logger.errorWithCause("[payments/webhooks/stripe] Failed to retrieve subscription for trial info", err);
    }
  }

  const customerId = resolveId(session.customer);

  // 4. Create subscription
  await prisma.subscription.upsert({
    where: { clientId: client.id },
    create: {
      clientId: client.id,
      stripeSubId: subscriptionId,
      stripeCustId: customerId,
      bundleId,
      status: "active",
      monthlyAmount: session.amount_total || 0,
      isTrial,
      trialEndsAt,
    },
    update: {
      stripeSubId: subscriptionId,
      stripeCustId: customerId,
      status: "active",
      monthlyAmount: session.amount_total || 0,
      isTrial,
      trialEndsAt,
    },
  });

  // 5. Activate services
  if (serviceIds.length > 0) {
    await activateServices(client.id, serviceIds);
  }

  // 6. Create welcome activity
  await prisma.activityEvent.create({
    data: {
      clientId: client.id,
      type: "lead_captured",
      title: "Welcome to Sovereign AI!",
      description: isTrial
        ? `${businessName || "Your business"} is now live with a 14-day free trial. Your AI services are being activated.`
        : `${businessName || "Your business"} is now live. Your AI services are being activated.`,
    },
  });

  // 7. Send welcome email with magic link
  await sendWelcomeEmail(
    email,
    ownerName || "there",
    businessName || "your business",
    authResult.url
  );

  // 8. Track referral conversion and apply Stripe credit to referrer
  const referralCode = metadata.referral_code;
  if (referralCode) {
    try {
      // Client-to-client referrals (ReferralCode table)
      const result = await trackReferralConversion(client.id, referralCode);
      if (result.credited && result.referrerId) {
        // Apply $500 credit to referrer's next Stripe invoice
        const referrerSub = await prisma.subscription.findUnique({
          where: { clientId: result.referrerId },
          select: { stripeCustId: true },
        });
        if (referrerSub?.stripeCustId) {
          // Apply credit via Stripe customer balance (negative amount = credit)
          await (stripe.customers as unknown as {
            createBalanceTransaction: (
              id: string,
              params: { amount: number; currency: string; description: string }
            ) => Promise<unknown>;
          }).createBalanceTransaction(referrerSub.stripeCustId, {
            amount: -50000,
            currency: "usd",
            description: "Referral credit — $500 for referring a new customer",
          });
          logger.info(`[payments/webhooks/stripe] Applied $500 referral credit to customer ${referrerSub.stripeCustId}`);
        }
      }

      // Affiliate partner referrals (AffiliateReferral table)
      const affiliateRef = await prisma.affiliateReferral.findUnique({
        where: { code: referralCode },
      });
      if (affiliateRef && !affiliateRef.clientId) {
        await prisma.affiliateReferral.update({
          where: { id: affiliateRef.id },
          data: {
            clientId: client.id,
            email: email || null,
            status: "signed_up",
            convertedAt: new Date(),
          },
        });
      }
    } catch (err) {
      // Don't fail the webhook over referral tracking
      logger.errorWithCause("[payments/webhooks/stripe] Referral tracking failed", err);
    }
  }
}

// ─── customer.subscription.updated ─────────────────────────────────────

async function handleSubscriptionUpdated(sub: SubscriptionObject) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
    select: {
      id: true,
      clientId: true,
      status: true,
      monthlyAmount: true,
      bundleId: true,
      isTrial: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  });
  if (!subscription) return;

  const amount = sub.items?.data?.[0]?.price?.unit_amount || subscription.monthlyAmount;

  // Map Stripe status to our internal status
  let status: string;
  switch (sub.status) {
    case "active":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
    case "unpaid":
      status = "canceled";
      break;
    case "trialing":
      status = "active"; // treat trialing as active
      break;
    case "incomplete":
      status = "past_due"; // initial payment pending (e.g. 3D Secure)
      break;
    case "incomplete_expired":
      status = "expired"; // initial payment window expired
      break;
    case "paused":
      status = "paused";
      break;
    default:
      status = subscription.status;
  }

  // Detect trial state
  const isTrial = sub.status === "trialing";
  const trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000) : subscription.trialEndsAt;

  // Check if the bundle changed via metadata
  const newBundleId = sub.metadata?.bundle_id || subscription.bundleId;

  // Validate the status transition (warn but don't block Stripe events)
  warnOnInvalidTransition(subscription.status, status, {
    subscriptionId: subscription.id,
    stripeSubId: sub.id,
    handler: "handleSubscriptionUpdated",
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status,
      monthlyAmount: amount,
      bundleId: newBundleId,
      isTrial,
      trialEndsAt,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : subscription.currentPeriodEnd,
    },
  });

  // If transitioning from trialing to active, log it
  if (subscription.isTrial && !isTrial && status === "active") {
    await prisma.activityEvent.create({
      data: {
        clientId: subscription.clientId,
        type: "lead_captured",
        title: "Trial ended — subscription active",
        description: "Your free trial has ended and your paid subscription is now active.",
      },
    });
  }
}

// ─── customer.subscription.deleted ─────────────────────────────────────

async function handleSubscriptionDeleted(sub: SubscriptionObject) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
    include: { client: true },
  });
  if (!subscription) return;

  // Validate the status transition (warn but don't block Stripe events)
  warnOnInvalidTransition(subscription.status, "canceled", {
    subscriptionId: subscription.id,
    stripeSubId: sub.id,
    handler: "handleSubscriptionDeleted",
  });

  // Run independent updates in parallel
  await Promise.all([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        isTrial: false,
      },
    }),
    // Deactivate all services
    prisma.clientService.updateMany({
      where: { clientId: subscription.clientId, status: "active" },
      data: { status: "canceled" },
    }),
    // Mark any affiliate referral as churned
    prisma.affiliateReferral.updateMany({
      where: { clientId: subscription.clientId, status: "paying" },
      data: { status: "churned", monthlyAmount: 0 },
    }),
    prisma.activityEvent.create({
      data: {
        clientId: subscription.clientId,
        type: "seo_update",
        title: "Subscription canceled",
        description: "Your subscription has been canceled. Services have been deactivated.",
      },
    }),
  ]);

  // Send cancellation email
  if (subscription.client) {
    try {
      const account = await prisma.account.findUnique({
        where: { id: subscription.client.accountId },
      });
      if (account) {
        const ownerName = subscription.client.ownerName || "there";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
        const html = emailLayout({
          preheader: "Your subscription has been canceled",
          body: `
            <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${ownerName},</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">Your Sovereign AI subscription has been canceled. Your services have been deactivated.</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">If this was a mistake or you'd like to reactivate, you can do so anytime from your dashboard.</p>
            ${emailButton("Reactivate Subscription", `${appUrl}/dashboard/billing`)}
            <p style="color:#666;font-size:14px;">We'd love to have you back. If you have any feedback, please reply to this email.</p>
          `,
          isTransactional: true,
        });
        await sendEmailQueued(account.email, "Your Subscription Has Been Canceled", html);
      }
    } catch (err) {
      logger.errorWithCause("[payments/webhooks/stripe] Failed to send cancellation email", err);
    }
  }
}

// ─── invoice.payment_succeeded ─────────────────────────────────────────

async function handleInvoicePaymentSucceeded(invoice: InvoiceObject) {
  const subscriptionId = resolveId(invoice.subscription);
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: subscriptionId },
    select: { id: true, clientId: true, status: true },
  });
  if (!subscription) return;

  // Build parallel operations for independent writes
  const amountPaid = invoice.amount_paid || 0;
  const parallelOps: Promise<unknown>[] = [];

  // Create a RevenueEvent for every successful payment
  if (amountPaid > 0) {
    parallelOps.push(
      prisma.revenueEvent.create({
        data: {
          clientId: subscription.clientId,
          channel: "subscription",
          eventType: "payment_received",
          amount: amountPaid, // already in cents from Stripe
          metadata: JSON.stringify({
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: subscriptionId,
            billingReason: invoice.billing_reason,
            periodStart: invoice.period_start,
            periodEnd: invoice.period_end,
          }),
        },
      })
    );
  }

  // Ensure subscription is active after successful payment
  if (subscription.status !== "active") {
    warnOnInvalidTransition(subscription.status, "active", {
      subscriptionId: subscription.id,
      handler: "handleInvoicePaymentSucceeded",
    });
    parallelOps.push(
      prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "active" },
      })
    );
  }

  parallelOps.push(
    prisma.activityEvent.create({
      data: {
        clientId: subscription.clientId,
        type: "lead_captured",
        title: "Payment received",
        description: `Payment of $${(amountPaid / 100).toFixed(2)} processed successfully.`,
      },
    })
  );

  await Promise.all(parallelOps);

  // Track affiliate commissions for recurring payments
  if (amountPaid > 0) {
    try {
      const affiliateRef = await prisma.affiliateReferral.findFirst({
        where: { clientId: subscription.clientId, status: { in: ["signed_up", "paying"] } },
        include: { affiliate: true },
      });

      if (affiliateRef) {
        const commissionCents = Math.round(
          (amountPaid * affiliateRef.affiliate.commissionRate) / 100
        );

        // Update the referral to "paying" status and accumulate earnings
        await prisma.affiliateReferral.update({
          where: { id: affiliateRef.id },
          data: {
            status: "paying",
            monthlyAmount: amountPaid,
            totalEarned: { increment: commissionCents },
          },
        });

        // Update the affiliate partner's total earned
        await prisma.affiliatePartner.update({
          where: { id: affiliateRef.affiliateId },
          data: {
            totalEarned: { increment: commissionCents },
          },
        });

        logger.info(
          `[payments/webhooks/stripe] Affiliate commission: ${commissionCents} cents for affiliate ${affiliateRef.affiliateId} from client ${subscription.clientId}`
        );
      }
    } catch (err) {
      // Don't fail the webhook over affiliate tracking
      logger.errorWithCause("[payments/webhooks/stripe] Affiliate commission tracking failed", err);
    }
  }
}

// ─── invoice.payment_failed ────────────────────────────────────────────

async function handlePaymentFailed(invoice: InvoiceObject) {
  const subscriptionId = resolveId(invoice.subscription);
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: subscriptionId },
    include: { client: { include: { account: true } } },
  });
  if (!subscription) return;

  // Validate the status transition (warn but don't block Stripe events)
  warnOnInvalidTransition(subscription.status, "past_due", {
    subscriptionId: subscription.id,
    stripeSubId: resolveId(invoice.subscription),
    handler: "handlePaymentFailed",
  });

  // Run independent updates in parallel
  const parallelOps: Promise<unknown>[] = [
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "past_due" },
    }),
    // Pause active services so they can be reactivated when payment succeeds.
    // handleInvoicePaid() restores "paused" services back to "active".
    prisma.clientService.updateMany({
      where: { clientId: subscription.clientId, status: "active" },
      data: { status: "paused" },
    }),
    prisma.activityEvent.create({
      data: {
        clientId: subscription.clientId,
        type: "seo_update",
        title: "Payment failed",
        description: "Your payment failed. Services have been paused. Please update your payment method to restore service.",
      },
    }),
  ];

  // Create a notification for the dashboard
  if (subscription.client?.accountId) {
    parallelOps.push(
      prisma.notification.create({
        data: {
          accountId: subscription.client.accountId,
          type: "billing",
          title: "Payment Failed",
          message: "Your latest payment could not be processed. Please update your payment method.",
          actionUrl: "/dashboard/billing",
        },
      })
    );
  }

  await Promise.all(parallelOps);

  // Send Telegram alert for payment failure (revenue impact)
  const businessName = subscription.client?.businessName ?? "Unknown";
  sendTelegramAlert(
    "warning",
    "Payment Failed",
    `Client: ${businessName}\nSubscription: ${subscriptionId}\nInvoice: ${invoice.id}\nServices have been paused.`,
  ).catch((err) => {
    logger.errorWithCause("[payments/webhooks/stripe] Telegram alert for payment failure failed", err);
  });

  // Send payment-failed email
  const clientEmail = subscription.client?.account?.email;
  const ownerName = subscription.client?.ownerName || "there";
  if (clientEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
    const html = emailLayout({
      preheader: "Action required: your payment failed",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${ownerName},</p>
        <p style="color:#333;font-size:16px;line-height:1.5;">We were unable to process your latest payment. Please update your payment method to avoid any interruption to your AI marketing services.</p>
        ${emailButton("Update Payment Method", `${appUrl}/dashboard/billing`, "danger")}
        <p style="color:#666;font-size:14px;">If you believe this is a mistake, please contact our support team.</p>
      `,
      isTransactional: true,
    });

    await sendEmailQueued(clientEmail, "Action Required: Payment Failed", html);
  }
}

// ─── invoice.paid ──────────────────────────────────────────────────────

async function handleInvoicePaid(invoice: InvoiceObject) {
  const subscriptionId = resolveId(invoice.subscription);
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: subscriptionId },
    select: { id: true, clientId: true, status: true },
  });
  if (!subscription) return;

  // Restore subscription to active if it was past_due
  if (subscription.status === "past_due") {
    warnOnInvalidTransition(subscription.status, "active", {
      subscriptionId: subscription.id,
      handler: "handleInvoicePaid",
    });

    await Promise.all([
      prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "active" },
      }),
      prisma.activityEvent.create({
        data: {
          clientId: subscription.clientId,
          type: "seo_update",
          title: "Payment successful",
          description: "Your payment has been received. Your subscription is now active again.",
        },
      }),
      // Re-activate services that were paused due to payment failure
      prisma.clientService.updateMany({
        where: { clientId: subscription.clientId, status: "paused" },
        data: { status: "active" },
      }),
    ]);
  }
}

// ─── customer.subscription.paused ───────────────────────────────────────

async function handleSubscriptionPaused(sub: SubscriptionObject) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
    select: { id: true, clientId: true, status: true },
  });
  if (!subscription) return;

  // Validate the status transition (warn but don't block Stripe events)
  warnOnInvalidTransition(subscription.status, "paused", {
    subscriptionId: subscription.id,
    stripeSubId: sub.id,
    handler: "handleSubscriptionPaused",
  });

  await Promise.all([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "paused" },
    }),
    // Pause all active services
    prisma.clientService.updateMany({
      where: { clientId: subscription.clientId, status: "active" },
      data: { status: "paused" },
    }),
    prisma.activityEvent.create({
      data: {
        clientId: subscription.clientId,
        type: "seo_update",
        title: "Subscription paused",
        description: "Your subscription has been paused. Services are on hold until you resume.",
      },
    }),
  ]);
}

// ─── customer.subscription.resumed ──────────────────────────────────────

async function handleSubscriptionResumed(sub: SubscriptionObject) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
    select: { id: true, clientId: true, status: true },
  });
  if (!subscription) return;

  // Validate the status transition (warn but don't block Stripe events)
  warnOnInvalidTransition(subscription.status, "active", {
    subscriptionId: subscription.id,
    stripeSubId: sub.id,
    handler: "handleSubscriptionResumed",
  });

  await Promise.all([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "active" },
    }),
    // Re-activate paused services
    prisma.clientService.updateMany({
      where: { clientId: subscription.clientId, status: "paused" },
      data: { status: "active" },
    }),
    prisma.activityEvent.create({
      data: {
        clientId: subscription.clientId,
        type: "lead_captured",
        title: "Subscription resumed",
        description: "Your subscription is active again. All services have been restored.",
      },
    }),
  ]);
}

// ─── charge.dispute.created ──────────────────────────────────────────

async function handleDisputeCreated(dispute: DisputeObject) {
  const customerId = resolveId(dispute.customer);
  if (!customerId) {
    logger.error("[payments/webhooks/stripe] No customer in dispute", { disputeId: dispute.id });
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustId: customerId },
    include: { client: { include: { account: true } } },
  });
  if (!subscription) {
    logger.warn("[payments/webhooks/stripe] No subscription found for dispute customer", {
      disputeId: dispute.id,
      customerId,
    });
    return;
  }

  const amount = dispute.amount || 0;
  const formattedAmount = `$${(amount / 100).toFixed(2)}`;

  // Run independent updates in parallel
  const parallelOps: Promise<unknown>[] = [
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "past_due" },
    }),
    prisma.auditLog.create({
      data: {
        accountId: subscription.client?.accountId || null,
        action: "dispute_created",
        resource: "dispute",
        resourceId: dispute.id,
        metadata: JSON.stringify({
          chargeId: dispute.charge,
          amount,
          currency: dispute.currency,
          reason: dispute.reason,
          status: dispute.status,
        }),
      },
    }),
    prisma.activityEvent.create({
      data: {
        clientId: subscription.clientId,
        type: "seo_update",
        title: "Chargeback received",
        description: `A dispute for ${formattedAmount} has been filed. Your subscription has been placed on hold.`,
      },
    }),
  ];

  // Create a notification for the dashboard
  if (subscription.client?.accountId) {
    parallelOps.push(
      prisma.notification.create({
        data: {
          accountId: subscription.client.accountId,
          type: "billing",
          title: "Chargeback Received",
          message: `⚠️ Chargeback received — ${formattedAmount} disputed`,
          actionUrl: "/dashboard/billing",
        },
      })
    );
  }

  await Promise.all(parallelOps);

  // Capture in Sentry as warning
  Sentry.captureMessage(
    `Chargeback received: ${formattedAmount} for customer ${customerId} (dispute: ${dispute.id}, reason: ${dispute.reason || "unknown"})`,
    "warning",
  );

  // Send Telegram alert for dispute (revenue impact)
  const businessName = subscription.client?.businessName ?? "Unknown";
  sendTelegramAlert(
    "warning",
    "Chargeback Received",
    `Client: ${businessName}\nAmount: ${formattedAmount}\nReason: ${dispute.reason || "Not specified"}\nDispute ID: ${dispute.id}`,
  ).catch((err) => {
    logger.errorWithCause("[payments/webhooks/stripe] Telegram alert for dispute failed", err);
  });

  // Send alert email to client owner
  const clientEmail = subscription.client?.account?.email;
  const ownerName = subscription.client?.ownerName || "there";
  if (clientEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
    const html = emailLayout({
      preheader: "A chargeback has been filed on your account",
      body: `
        <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${ownerName},</p>
        <p style="color:#333;font-size:16px;line-height:1.5;">We've received a chargeback dispute for <strong>${formattedAmount}</strong> on your account. Your subscription has been placed on hold until the dispute is resolved.</p>
        <p style="color:#333;font-size:16px;line-height:1.5;">If you did not initiate this dispute, please contact your bank to withdraw it, then reach out to us so we can restore your services.</p>
        ${emailButton("View Billing Details", `${appUrl}/dashboard/billing`, "danger")}
        <p style="color:#666;font-size:14px;">If you have questions, please reply to this email.</p>
      `,
      isTransactional: true,
    });

    await sendEmailQueued(clientEmail, "Action Required: Chargeback Received", html);
  }
}

// ─── charge.dispute.closed ───────────────────────────────────────────

async function handleDisputeClosed(dispute: DisputeObject) {
  const customerId = resolveId(dispute.customer);
  if (!customerId) {
    logger.error("[payments/webhooks/stripe] No customer in closed dispute", { disputeId: dispute.id });
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustId: customerId },
    include: { client: { include: { account: true } } },
  });
  if (!subscription) {
    logger.warn("[payments/webhooks/stripe] No subscription found for closed dispute customer", {
      disputeId: dispute.id,
      customerId,
    });
    return;
  }

  const amount = dispute.amount || 0;
  const formattedAmount = `$${(amount / 100).toFixed(2)}`;
  const disputeWon = dispute.status === "won";
  const disputeWithdrawn = dispute.status === "warning_closed";

  // Determine outcome
  const isResolved = disputeWon || disputeWithdrawn;

  const parallelOps: Promise<unknown>[] = [
    prisma.auditLog.create({
      data: {
        accountId: subscription.client?.accountId || null,
        action: "dispute_closed",
        resource: "dispute",
        resourceId: dispute.id,
        metadata: JSON.stringify({
          chargeId: dispute.charge,
          amount,
          currency: dispute.currency,
          status: dispute.status,
          outcome: isResolved ? "won" : "lost",
        }),
      },
    }),
  ];

  if (isResolved) {
    // Dispute won or withdrawn: restore subscription to active
    parallelOps.push(
      prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "active" },
      }),
      prisma.activityEvent.create({
        data: {
          clientId: subscription.clientId,
          type: "lead_captured",
          title: "Dispute resolved in your favor",
          description: `The ${formattedAmount} dispute has been resolved in your favor. Your subscription is active again.`,
        },
      }),
      // Re-activate services that were paused due to the dispute
      prisma.clientService.updateMany({
        where: { clientId: subscription.clientId, status: "paused" },
        data: { status: "active" },
      }),
    );

    if (subscription.client?.accountId) {
      parallelOps.push(
        prisma.notification.create({
          data: {
            accountId: subscription.client.accountId,
            type: "billing",
            title: "Dispute Resolved",
            message: `Dispute resolved in your favor — ${formattedAmount} returned`,
            actionUrl: "/dashboard/billing",
          },
        })
      );
    }
  } else {
    // Dispute lost: keep past_due status
    parallelOps.push(
      prisma.activityEvent.create({
        data: {
          clientId: subscription.clientId,
          type: "seo_update",
          title: "Dispute lost",
          description: `Dispute lost — ${formattedAmount} charged back. Please update your payment method to restore service.`,
        },
      }),
    );

    if (subscription.client?.accountId) {
      parallelOps.push(
        prisma.notification.create({
          data: {
            accountId: subscription.client.accountId,
            type: "billing",
            title: "Dispute Lost",
            message: `Dispute lost — ${formattedAmount} charged back`,
            actionUrl: "/dashboard/billing",
          },
        })
      );
    }
  }

  await Promise.all(parallelOps);

  // Send Telegram alert with outcome
  const businessName = subscription.client?.businessName ?? "Unknown";
  sendTelegramAlert(
    isResolved ? "info" : "warning",
    `Dispute ${isResolved ? "Won" : "Lost"}`,
    `Client: ${businessName}\nAmount: ${formattedAmount}\nOutcome: ${dispute.status}\nDispute ID: ${dispute.id}`,
  ).catch((err) => {
    logger.errorWithCause("[payments/webhooks/stripe] Telegram alert for dispute closure failed", err);
  });

  // Send outcome email to client owner
  const clientEmail = subscription.client?.account?.email;
  const ownerName = subscription.client?.ownerName || "there";
  if (clientEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
    const subject = isResolved
      ? "Dispute Resolved in Your Favor"
      : "Dispute Lost — Action Required";
    const html = emailLayout({
      preheader: isResolved
        ? "Your dispute has been resolved"
        : "Your dispute was not resolved in your favor",
      body: isResolved
        ? `
          <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${ownerName},</p>
          <p style="color:#333;font-size:16px;line-height:1.5;">Great news! The ${formattedAmount} dispute has been resolved in your favor. Your subscription is now active and all services have been restored.</p>
          ${emailButton("View Dashboard", `${appUrl}/dashboard`)}
        `
        : `
          <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${ownerName},</p>
          <p style="color:#333;font-size:16px;line-height:1.5;">Unfortunately, the ${formattedAmount} dispute was not resolved in your favor and the amount has been charged back. Please update your payment method to restore your services.</p>
          ${emailButton("Update Payment Method", `${appUrl}/dashboard/billing`, "danger")}
          <p style="color:#666;font-size:14px;">If you have questions, please reply to this email.</p>
        `,
      isTransactional: true,
    });

    await sendEmailQueued(clientEmail, subject, html);
  }
}
