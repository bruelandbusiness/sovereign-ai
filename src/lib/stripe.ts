import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.warn("[Stripe] STRIPE_SECRET_KEY not set — Stripe calls will fail in production");
}

// Placeholder allows module to load during build (NODE_ENV=production)
// without STRIPE_SECRET_KEY. All routes call assertStripeConfigured()
// before using stripe, ensuring the real key is present at runtime.
export const stripe = new Stripe(
  stripeKey || "sk_test_placeholder",
  {
    apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
    typescript: true,
  }
);

/** Call before any Stripe operation to ensure key is configured */
export function assertStripeConfigured(): void {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required but not configured");
  }
}
