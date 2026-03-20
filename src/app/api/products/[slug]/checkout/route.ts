import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { rateLimitByIP } from "@/lib/rate-limit";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limit: 10 product checkout attempts per hour per IP
    const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "product-checkout", 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    assertStripeConfigured();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const product = await prisma.digitalProduct.findUnique({
      where: { slug },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if already purchased
    const existingPurchase = await prisma.productPurchase.findUnique({
      where: {
        productId_accountId: {
          productId: product.id,
          accountId: session.account.id,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You have already purchased this product" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Look up existing Stripe customer ID to avoid creating duplicate customers
    const existingClient = await prisma.client.findUnique({
      where: { accountId: session.account.id },
      include: { subscription: { select: { stripeCustId: true } } },
    });
    const stripeCustId = existingClient?.subscription?.stripeCustId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkoutSession = await (stripe.checkout.sessions.create as any)({
      mode: "payment",
      payment_method_types: ["card"],
      // Reuse existing Stripe customer if available; otherwise fall back to email
      ...(stripeCustId
        ? { customer: stripeCustId }
        : { customer_email: session.account.email }),
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.tagline,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "digital_product",
        product_id: product.id,
        product_slug: product.slug,
        account_id: session.account.id,
        email: session.account.email,
      },
      success_url: `${appUrl}/products/library?purchased=true`,
      cancel_url: `${appUrl}/products/${slug}`,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Product checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
