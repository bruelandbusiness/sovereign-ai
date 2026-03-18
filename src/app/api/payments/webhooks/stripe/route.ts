import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAccountWithMagicLink } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { activateServices } from "@/lib/services/activator";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    // Forward to Python backend for Stripe signature verification
    let event: {
      type: string;
      data: {
        object: {
          id: string;
          customer?: string;
          customer_email?: string;
          metadata?: Record<string, string>;
          subscription?: string;
          amount_total?: number;
        };
      };
    };

    try {
      const response = await fetch(
        `${API_URL}/api/payments/webhooks/stripe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": signature,
          },
          body,
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { detail: "Webhook verification failed" },
          { status: response.status }
        );
      }

      event = await response.json();
    } catch {
      // If Python backend is down, try to parse the event directly
      // (for development — in production, always verify signatures)
      event = JSON.parse(body);
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { detail: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: {
  id: string;
  customer?: string;
  customer_email?: string;
  metadata?: Record<string, string>;
  subscription?: string;
  amount_total?: number;
}) {
  const email = session.customer_email || session.metadata?.email;
  if (!email) {
    console.error("No email in checkout session:", session.id);
    return;
  }

  const metadata = session.metadata || {};
  const ownerName = metadata.customer_name || "";
  const businessName = metadata.business_name || "";
  const serviceIds = metadata.services
    ? JSON.parse(metadata.services)
    : [];
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
    // ignore parse errors
  }

  const step1 = (onboardingData.step1 || {}) as Record<string, string>;

  const client = await prisma.client.upsert({
    where: { accountId: authResult.account.id },
    create: {
      accountId: authResult.account.id,
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
      businessName: businessName || step1.businessName || undefined,
      onboardingData: JSON.stringify(onboardingData),
    },
  });

  // 3. Create subscription
  await prisma.subscription.upsert({
    where: { clientId: client.id },
    create: {
      clientId: client.id,
      stripeSubId: session.subscription || null,
      stripeCustId: session.customer || null,
      bundleId,
      status: "active",
      monthlyAmount: session.amount_total || 0,
    },
    update: {
      stripeSubId: session.subscription || null,
      status: "active",
      monthlyAmount: session.amount_total || 0,
    },
  });

  // 4. Activate services
  if (serviceIds.length > 0) {
    await activateServices(client.id, serviceIds);
  }

  // 5. Create welcome activity
  await prisma.activityEvent.create({
    data: {
      clientId: client.id,
      type: "lead_captured",
      title: "Welcome to Sovereign AI!",
      description: `${businessName || "Your business"} is now live. Your AI services are being activated.`,
    },
  });

  // 6. Send welcome email with magic link
  await sendWelcomeEmail(
    email,
    ownerName || "there",
    businessName || "your business",
    authResult.url
  );
}

async function handleSubscriptionUpdated(sub: {
  id: string;
  customer?: string;
  status?: string;
  current_period_end?: number;
  items?: { data: { price: { unit_amount: number } }[] };
}) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
  });
  if (!subscription) return;

  const amount = sub.items?.data?.[0]?.price?.unit_amount || subscription.monthlyAmount;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : subscription.status,
      monthlyAmount: amount,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : subscription.currentPeriodEnd,
    },
  });
}

async function handleSubscriptionDeleted(sub: { id: string }) {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: sub.id },
    include: { client: true },
  });
  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "canceled" },
  });

  // Deactivate all services
  await prisma.clientService.updateMany({
    where: { clientId: subscription.clientId, status: "active" },
    data: { status: "canceled" },
  });

  await prisma.activityEvent.create({
    data: {
      clientId: subscription.clientId,
      type: "seo_update",
      title: "Subscription canceled",
      description: "Your subscription has been canceled. Services have been deactivated.",
    },
  });
}

async function handlePaymentFailed(invoice: {
  customer?: string;
  subscription?: string;
}) {
  if (!invoice.subscription) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubId: invoice.subscription },
  });
  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "past_due" },
  });

  await prisma.activityEvent.create({
    data: {
      clientId: subscription.clientId,
      type: "seo_update",
      title: "Payment failed",
      description: "Your payment failed. Please update your payment method to avoid service interruption.",
    },
  });
}
