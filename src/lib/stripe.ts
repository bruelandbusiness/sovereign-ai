import Stripe from "stripe";
import { logger } from "@/lib/logger";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is required in production");
}

// Lazy singleton: only create the Stripe client when actually needed,
// and only if the key is present. This prevents crashes at import time
// when the key is missing in development.
let _stripe: Stripe | null = null;

/**
 * Returns the Stripe client instance, or null if STRIPE_SECRET_KEY is
 * not configured. Callers must handle the null case (graceful degradation).
 */
export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  if (!stripeKey) {
    logger.warn("[stripe] STRIPE_SECRET_KEY not configured — Stripe is disabled.");
    return null;
  }
  _stripe = new Stripe(stripeKey, {
    apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return _stripe;
}

/**
 * Returns the Stripe client, throwing if not configured.
 * Use this in code paths that absolutely require Stripe (e.g. webhook handlers).
 */
export function requireStripe(): Stripe {
  const client = getStripe();
  if (!client) {
    throw new Error("STRIPE_SECRET_KEY is required but not configured");
  }
  return client;
}

/**
 * Backwards-compatible export. Returns the Stripe client or a proxy that
 * throws on any property access when the key is missing, so existing code
 * that imports `stripe` directly won't crash at module load time but will
 * get a clear error when it tries to use Stripe without the key.
 */
export const stripe: Stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
      typescript: true,
    })
  : (new Proxy({} as Stripe, {
      get(_target, prop) {
        // Allow typeof checks and JSON serialization to work
        if (prop === Symbol.toPrimitive || prop === "toJSON" || prop === Symbol.toStringTag) {
          return undefined;
        }
        throw new Error(
          `Stripe is not configured (STRIPE_SECRET_KEY missing). Cannot access stripe.${String(prop)}`
        );
      },
    }) as Stripe);

/** @deprecated Use requireStripe() or getStripe() instead */
export function assertStripeConfigured(): void {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required but not configured");
  }
}
