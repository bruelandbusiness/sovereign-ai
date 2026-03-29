/**
 * Stripe webhook and payment helper utilities.
 *
 * Pure data-transformation functions — no Stripe SDK calls.
 * All monetary values follow the Stripe convention of cents (integer).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Internal tier identifiers aligned with service-tiers.ts TierId. */
export type SubscriptionTier = "starter" | "growth" | "scale" | "enterprise";

/** Subscription lifecycle events emitted by Stripe webhooks. */
export interface SubscriptionEvent {
  readonly subscriptionId: string;
  readonly customerId: string;
  readonly status: string;
  readonly tier: SubscriptionTier;
  readonly currentPeriodStart: number;
  readonly currentPeriodEnd: number;
  readonly cancelAtPeriodEnd: boolean;
  readonly metadata: Readonly<Record<string, string>>;
}

/** Payment-related events from Stripe PaymentIntent objects. */
export interface PaymentEvent {
  readonly paymentIntentId: string;
  readonly customerId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly status: "succeeded" | "failed";
  readonly errorMessage: string | null;
  readonly metadata: Readonly<Record<string, string>>;
}

/** Invoice lifecycle events from Stripe. */
export interface InvoiceEvent {
  readonly invoiceId: string;
  readonly customerId: string;
  readonly subscriptionId: string | null;
  readonly amountDueCents: number;
  readonly amountPaidCents: number;
  readonly currency: string;
  readonly status: string;
  readonly hostedInvoiceUrl: string | null;
}

/** Standardised result returned by every webhook handler. */
export interface WebhookHandlerResult<T = unknown> {
  readonly success: boolean;
  readonly event: string;
  readonly message: string;
  readonly data?: T;
}

// ---------------------------------------------------------------------------
// Handler metadata attached to each Stripe event type
// ---------------------------------------------------------------------------

export interface EventHandlerMeta {
  readonly description: string;
  readonly category: "checkout" | "subscription" | "invoice" | "payment";
  readonly requiresCustomer: boolean;
  readonly idempotencyKey: string;
}

/**
 * Maps every handled Stripe event type to descriptive handler metadata.
 * Used for routing, logging, and documentation.
 */
export const STRIPE_EVENTS: Readonly<Record<string, EventHandlerMeta>> = {
  "checkout.session.completed": {
    description: "Customer completed checkout — provision access.",
    category: "checkout",
    requiresCustomer: true,
    idempotencyKey: "checkout_session_id",
  },
  "customer.subscription.created": {
    description: "New subscription created for customer.",
    category: "subscription",
    requiresCustomer: true,
    idempotencyKey: "subscription_id",
  },
  "customer.subscription.updated": {
    description: "Subscription plan, status, or billing changed.",
    category: "subscription",
    requiresCustomer: true,
    idempotencyKey: "subscription_id",
  },
  "customer.subscription.deleted": {
    description: "Subscription cancelled or expired — revoke access.",
    category: "subscription",
    requiresCustomer: true,
    idempotencyKey: "subscription_id",
  },
  "invoice.paid": {
    description: "Invoice payment succeeded — record payment.",
    category: "invoice",
    requiresCustomer: true,
    idempotencyKey: "invoice_id",
  },
  "invoice.payment_failed": {
    description: "Invoice payment failed — notify customer and retry.",
    category: "invoice",
    requiresCustomer: true,
    idempotencyKey: "invoice_id",
  },
  "payment_intent.succeeded": {
    description: "One-time payment succeeded.",
    category: "payment",
    requiresCustomer: false,
    idempotencyKey: "payment_intent_id",
  },
  "payment_intent.failed": {
    description: "One-time payment failed.",
    category: "payment",
    requiresCustomer: false,
    idempotencyKey: "payment_intent_id",
  },
} as const;

// ---------------------------------------------------------------------------
// Stripe price-ID → internal tier mapping
// ---------------------------------------------------------------------------

/**
 * Environment-sourced Stripe price IDs.
 * In production these come from env vars; here we define the lookup table
 * structure so callers can supply their own mapping or use the defaults.
 */
export interface StripePriceMap {
  readonly [priceId: string]: SubscriptionTier;
}

const DEFAULT_PRICE_MAP: StripePriceMap = {
  price_starter_monthly: "starter",
  price_starter_yearly: "starter",
  price_growth_monthly: "growth",
  price_growth_yearly: "growth",
  price_scale_monthly: "scale",
  price_scale_yearly: "scale",
  price_enterprise_monthly: "enterprise",
  price_enterprise_yearly: "enterprise",
};

/**
 * Resolves a Stripe price ID to the corresponding internal tier name.
 *
 * @param priceId - Stripe price identifier (e.g. "price_growth_monthly").
 * @param overrideMap - Optional custom mapping; falls back to defaults.
 * @returns The matching tier, or null when the price ID is unrecognised.
 */
export function mapStripePlanToTier(
  priceId: string,
  overrideMap?: StripePriceMap,
): SubscriptionTier | null {
  const map = overrideMap ?? DEFAULT_PRICE_MAP;
  return map[priceId] ?? null;
}

// ---------------------------------------------------------------------------
// Webhook event parsing / signature verification structure
// ---------------------------------------------------------------------------

export interface RawWebhookPayload {
  readonly body: string;
  readonly signature: string;
  readonly endpointSecret: string;
}

export interface ParsedStripeEvent {
  readonly id: string;
  readonly type: string;
  readonly created: number;
  readonly livemode: boolean;
  readonly data: Readonly<Record<string, unknown>>;
}

/**
 * Validates and parses a raw Stripe webhook payload.
 *
 * This function performs structural validation only — actual cryptographic
 * signature verification should be delegated to the Stripe SDK at the
 * integration boundary.  The function ensures the payload is well-formed
 * JSON, contains the required top-level fields, and maps to a known event.
 *
 * @returns A WebhookHandlerResult wrapping the parsed event on success.
 */
export function parseStripeEvent(
  payload: RawWebhookPayload,
): WebhookHandlerResult<ParsedStripeEvent> {
  if (!payload.body || !payload.signature || !payload.endpointSecret) {
    return {
      success: false,
      event: "unknown",
      message: "Missing required webhook fields (body, signature, or endpointSecret).",
    };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payload.body) as Record<string, unknown>;
  } catch {
    return {
      success: false,
      event: "unknown",
      message: "Webhook body is not valid JSON.",
    };
  }

  const id = parsed["id"];
  const type = parsed["type"];
  const created = parsed["created"];
  const livemode = parsed["livemode"];
  const data = parsed["data"];

  if (
    typeof id !== "string" ||
    typeof type !== "string" ||
    typeof created !== "number" ||
    typeof livemode !== "boolean" ||
    typeof data !== "object" ||
    data === null
  ) {
    return {
      success: false,
      event: String(type ?? "unknown"),
      message: "Webhook payload missing required fields (id, type, created, livemode, data).",
    };
  }

  const eventMeta = STRIPE_EVENTS[type];
  if (!eventMeta) {
    return {
      success: false,
      event: type,
      message: `Unhandled Stripe event type: ${type}`,
    };
  }

  const stripeEvent: ParsedStripeEvent = {
    id: id as string,
    type,
    created: created as number,
    livemode: livemode as boolean,
    data: data as Readonly<Record<string, unknown>>,
  };

  return {
    success: true,
    event: type,
    message: eventMeta.description,
    data: stripeEvent,
  };
}

// ---------------------------------------------------------------------------
// Subscription helpers
// ---------------------------------------------------------------------------

export interface SubscriptionData {
  readonly status: string;
  readonly currentPeriodEnd: number;
  readonly items: ReadonlyArray<{
    readonly priceId: string;
    readonly unitAmountCents: number;
    readonly interval: "month" | "year";
    readonly quantity: number;
  }>;
}

const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "trialing",
]);

/**
 * Returns true when the subscription is in an active or trialing state.
 */
export function isSubscriptionActive(subscription: SubscriptionData): boolean {
  return ACTIVE_STATUSES.has(subscription.status);
}

/**
 * Calculates the number of full days remaining in the current billing period.
 * Returns 0 when the period has already ended.
 *
 * @param subscription - Subscription containing `currentPeriodEnd` (unix seconds).
 * @param nowMs - Current time in milliseconds (defaults to Date.now()).
 */
export function getSubscriptionDaysRemaining(
  subscription: Pick<SubscriptionData, "currentPeriodEnd">,
  nowMs: number = Date.now(),
): number {
  const endMs = subscription.currentPeriodEnd * 1000;
  const diffMs = endMs - nowMs;
  if (diffMs <= 0) {
    return 0;
  }
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Derives the Monthly Recurring Revenue (MRR) in cents from subscription
 * line items.  Yearly prices are divided by 12 to normalise to monthly.
 */
export function calculateMRRFromSubscription(
  subscription: Pick<SubscriptionData, "items">,
): number {
  return subscription.items.reduce((mrr, item) => {
    const lineTotal = item.unitAmountCents * item.quantity;
    const monthlyAmount = item.interval === "year" ? lineTotal / 12 : lineTotal;
    return mrr + Math.round(monthlyAmount);
  }, 0);
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "usd";

/**
 * Converts a Stripe amount (cents) to a human-readable currency string.
 *
 * @param amountCents - Amount in the smallest currency unit (e.g. cents).
 * @param currency - ISO 4217 currency code (default "usd").
 * @param locale - BCP-47 locale for formatting (default "en-US").
 * @returns Formatted string such as "$49.99".
 */
export function formatStripeAmount(
  amountCents: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  const majorUnits = amountCents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(majorUnits);
}

// ---------------------------------------------------------------------------
// Checkout line-item builder
// ---------------------------------------------------------------------------

/** Minimal representation of a selected service before checkout. */
export interface ServiceSelection {
  readonly name: string;
  readonly priceId: string;
  readonly quantity: number;
  readonly description?: string;
}

/** Line item shape accepted by Stripe Checkout Sessions. */
export interface CheckoutLineItem {
  readonly price: string;
  readonly quantity: number;
  readonly adjustable_quantity?: {
    readonly enabled: boolean;
    readonly minimum: number;
    readonly maximum: number;
  };
}

/**
 * Builds an array of Stripe-compatible checkout line items from a list of
 * service selections.
 *
 * @param selections - Services the customer has chosen.
 * @param allowQuantityAdjust - When true, each item can be adjusted 1-10.
 * @returns Line items ready for a Stripe Checkout Session create call.
 * @throws When selections is empty or contains invalid entries.
 */
export function buildCheckoutLineItems(
  selections: readonly ServiceSelection[],
  allowQuantityAdjust: boolean = false,
): readonly CheckoutLineItem[] {
  if (selections.length === 0) {
    throw new Error("At least one service selection is required to build checkout line items.");
  }

  return selections.map((selection): CheckoutLineItem => {
    if (!selection.priceId) {
      throw new Error(`Missing priceId for service "${selection.name}".`);
    }
    if (selection.quantity < 1) {
      throw new Error(
        `Quantity must be at least 1 for service "${selection.name}" (got ${String(selection.quantity)}).`,
      );
    }

    const lineItem: CheckoutLineItem = {
      price: selection.priceId,
      quantity: selection.quantity,
      ...(allowQuantityAdjust
        ? {
            adjustable_quantity: {
              enabled: true,
              minimum: 1,
              maximum: 10,
            },
          }
        : {}),
    };

    return lineItem;
  });
}
