// ---------------------------------------------------------------------------
// Pricing Calculator Utility
// ---------------------------------------------------------------------------
// Calculates pricing for Sovereign AI service bundles, including volume
// discounts, annual savings projections, and side-by-side tier comparisons.
// Pure computation -- no database calls or side effects.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Identifier for every service offered on the platform. */
export type ServiceId =
  | "chatbot"
  | "reviews"
  | "content"
  | "email"
  | "booking"
  | "ads"
  | "seo"
  | "social"
  | "analytics"
  | "reputation"
  | "retargeting"
  | "voice-agent"
  | "gbp"
  | "fsm"
  | "referral-program"
  | "estimate"
  | "aeo"
  | "customer-ltv";

/** Monthly price metadata for a single service. */
export interface ServicePrice {
  readonly id: ServiceId;
  readonly label: string;
  readonly monthlyPrice: number;
  /** Short value-prop shown in comparison tables. */
  readonly description: string;
}

/** A discount tier that kicks in when the bundle reaches a service count. */
export interface PricingTier {
  readonly minServices: number;
  readonly discountPercent: number;
  readonly label: string;
}

/** Discount configuration that maps service-count thresholds to percentages. */
export interface BundleDiscount {
  readonly tiers: readonly PricingTier[];
}

/** Detailed cost breakdown returned by `calculateBundlePrice`. */
export interface PricingBreakdown {
  readonly services: readonly ServicePrice[];
  readonly subtotal: number;
  readonly applicableTier: PricingTier | null;
  readonly discountPercent: number;
  readonly discountAmount: number;
  readonly total: number;
}

/** Annual comparison returned by `calculateAnnualSavings`. */
export interface AnnualSavingsBreakdown {
  readonly monthlyTotal: number;
  readonly annualTotal: number;
  readonly annualWithoutDiscount: number;
  readonly annualSavings: number;
}

/** Side-by-side comparison of two bundles. */
export interface TierComparison {
  readonly bundleA: PricingBreakdown;
  readonly bundleB: PricingBreakdown;
  readonly priceDifference: number;
  readonly additionalServices: readonly ServicePrice[];
  readonly percentageSaved: number;
}

/** Recommendation for the next service to add. */
export interface ServiceSuggestion {
  readonly service: ServicePrice;
  readonly currentTotal: number;
  readonly newTotal: number;
  readonly effectiveCostOfNewService: number;
  readonly reason: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_SERVICE_COUNT = 18;

/** Monthly prices for every platform service. */
export const SERVICE_PRICES: Readonly<Record<ServiceId, ServicePrice>> = {
  chatbot: {
    id: "chatbot",
    label: "AI Chatbot",
    monthlyPrice: 149,
    description: "24/7 conversational lead capture on your website",
  },
  reviews: {
    id: "reviews",
    label: "Review Management",
    monthlyPrice: 99,
    description: "Automated review solicitation and AI responses",
  },
  content: {
    id: "content",
    label: "Content Creation",
    monthlyPrice: 199,
    description: "AI-generated blog posts, landing pages, and copy",
  },
  email: {
    id: "email",
    label: "Email Marketing",
    monthlyPrice: 129,
    description: "Drip campaigns, nurture sequences, and newsletters",
  },
  booking: {
    id: "booking",
    label: "Online Booking",
    monthlyPrice: 79,
    description: "Self-service scheduling with calendar sync",
  },
  ads: {
    id: "ads",
    label: "Ad Management",
    monthlyPrice: 249,
    description: "Google and Meta ad campaign management",
  },
  seo: {
    id: "seo",
    label: "SEO Optimization",
    monthlyPrice: 179,
    description: "On-page SEO, keyword tracking, and link building",
  },
  social: {
    id: "social",
    label: "Social Media",
    monthlyPrice: 149,
    description: "Automated posting and engagement across platforms",
  },
  analytics: {
    id: "analytics",
    label: "Analytics Dashboard",
    monthlyPrice: 99,
    description: "Unified reporting across all marketing channels",
  },
  reputation: {
    id: "reputation",
    label: "Reputation Monitoring",
    monthlyPrice: 119,
    description: "Real-time alerts and sentiment tracking",
  },
  retargeting: {
    id: "retargeting",
    label: "Retargeting Ads",
    monthlyPrice: 159,
    description: "Re-engage website visitors with display ads",
  },
  "voice-agent": {
    id: "voice-agent",
    label: "AI Voice Agent",
    monthlyPrice: 199,
    description: "Inbound/outbound AI phone calls for scheduling and follow-ups",
  },
  gbp: {
    id: "gbp",
    label: "Google Business Profile",
    monthlyPrice: 89,
    description: "GBP optimization, posts, and Q&A management",
  },
  fsm: {
    id: "fsm",
    label: "Field Service Management",
    monthlyPrice: 169,
    description: "Job dispatch, technician tracking, and invoicing",
  },
  "referral-program": {
    id: "referral-program",
    label: "Referral Program",
    monthlyPrice: 109,
    description: "Automated customer referral tracking and rewards",
  },
  estimate: {
    id: "estimate",
    label: "Estimate Builder",
    monthlyPrice: 119,
    description: "AI-assisted job estimates and proposal generation",
  },
  aeo: {
    id: "aeo",
    label: "Answer Engine Optimization",
    monthlyPrice: 139,
    description: "Optimize content for AI search and featured snippets",
  },
  "customer-ltv": {
    id: "customer-ltv",
    label: "Customer LTV Tracking",
    monthlyPrice: 99,
    description: "Lifetime value analytics and churn prediction",
  },
} as const;

/** Discount tiers based on the number of services in a bundle. */
export const BUNDLE_DISCOUNTS: BundleDiscount = {
  tiers: [
    { minServices: TOTAL_SERVICE_COUNT, discountPercent: 25, label: "All-In" },
    { minServices: 8, discountPercent: 20, label: "Enterprise" },
    { minServices: 5, discountPercent: 15, label: "Growth" },
    { minServices: 3, discountPercent: 10, label: "Starter" },
  ],
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the best applicable discount tier for a given service count.
 * Tiers are sorted descending by `minServices`, so the first match wins.
 */
function resolveDiscountTier(
  serviceCount: number,
): PricingTier | null {
  for (const tier of BUNDLE_DISCOUNTS.tiers) {
    if (serviceCount >= tier.minServices) {
      return tier;
    }
  }
  return null;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the total monthly price for a bundle of services, applying the
 * highest applicable volume discount.
 *
 * @param serviceIds - Services included in the bundle.
 * @returns Full pricing breakdown with discount details.
 * @throws {Error} If `serviceIds` is empty or contains an unknown service.
 */
export function calculateBundlePrice(
  serviceIds: readonly ServiceId[],
): PricingBreakdown {
  if (serviceIds.length === 0) {
    throw new Error("At least one service is required to calculate a bundle price.");
  }

  const uniqueIds = Array.from(new Set(serviceIds));
  const services: ServicePrice[] = uniqueIds.map((id) => {
    const service = SERVICE_PRICES[id];
    if (!service) {
      throw new Error(`Unknown service id: "${id}".`);
    }
    return service;
  });

  const subtotal = services.reduce((sum, s) => sum + s.monthlyPrice, 0);
  const tier = resolveDiscountTier(services.length);
  const discountPercent = tier?.discountPercent ?? 0;
  const discountAmount = roundCents(subtotal * (discountPercent / 100));
  const total = roundCents(subtotal - discountAmount);

  return {
    services,
    subtotal,
    applicableTier: tier,
    discountPercent,
    discountAmount,
    total,
  };
}

/**
 * Compare annual costs with and without the bundle discount.
 *
 * @param serviceIds - Services in the bundle.
 * @returns Breakdown of annual totals and savings.
 */
export function calculateAnnualSavings(
  serviceIds: readonly ServiceId[],
): AnnualSavingsBreakdown {
  const breakdown = calculateBundlePrice(serviceIds);
  const monthlyTotal = breakdown.total;
  const annualTotal = roundCents(monthlyTotal * 12);
  const annualWithoutDiscount = roundCents(breakdown.subtotal * 12);
  const annualSavings = roundCents(annualWithoutDiscount - annualTotal);

  return {
    monthlyTotal,
    annualTotal,
    annualWithoutDiscount,
    annualSavings,
  };
}

/**
 * Suggest the next best service to add to a bundle.
 *
 * Strategy: pick the service that yields the largest *effective discount*
 * when added -- i.e., the service whose sticker price drops the most once
 * the new bundle discount is applied. Ties are broken by lower sticker price
 * (better value).
 *
 * @param currentServiceIds - Services already in the bundle.
 * @returns Suggestion with cost impact details, or `null` when all services
 *          are already included.
 */
export function suggestNextService(
  currentServiceIds: readonly ServiceId[],
): ServiceSuggestion | null {
  const currentSet = new Set(currentServiceIds);
  const allIds = Object.keys(SERVICE_PRICES) as ServiceId[];
  const candidates = allIds.filter((id) => !currentSet.has(id));

  if (candidates.length === 0) {
    return null;
  }

  const currentBreakdown = currentServiceIds.length > 0
    ? calculateBundlePrice(currentServiceIds)
    : { total: 0, subtotal: 0 };

  let bestSuggestion: ServiceSuggestion | null = null;

  for (const candidateId of candidates) {
    const newBundle = [...currentServiceIds, candidateId];
    const newBreakdown = calculateBundlePrice(newBundle);
    const effectiveCost = roundCents(newBreakdown.total - currentBreakdown.total);
    const stickerPrice = SERVICE_PRICES[candidateId].monthlyPrice;
    const savings = roundCents(stickerPrice - effectiveCost);

    const isBetter =
      bestSuggestion === null ||
      savings > (SERVICE_PRICES[bestSuggestion.service.id].monthlyPrice -
        bestSuggestion.effectiveCostOfNewService) ||
      (savings ===
          (SERVICE_PRICES[bestSuggestion.service.id].monthlyPrice -
            bestSuggestion.effectiveCostOfNewService) &&
        stickerPrice < SERVICE_PRICES[bestSuggestion.service.id].monthlyPrice);

    if (isBetter) {
      const tierBefore = resolveDiscountTier(currentServiceIds.length);
      const tierAfter = resolveDiscountTier(newBundle.length);
      const unlocksNewTier =
        (tierAfter?.minServices ?? 0) > (tierBefore?.minServices ?? 0);

      const reason: string = unlocksNewTier
        ? `Adding ${SERVICE_PRICES[candidateId].label} unlocks the ${tierAfter!.label} tier (${tierAfter!.discountPercent}% off), saving $${savings.toFixed(2)}/mo vs sticker price.`
        : `${SERVICE_PRICES[candidateId].label} adds the most value at an effective cost of $${effectiveCost.toFixed(2)}/mo (sticker: $${stickerPrice}/mo).`;

      bestSuggestion = {
        service: SERVICE_PRICES[candidateId],
        currentTotal: currentBreakdown.total,
        newTotal: newBreakdown.total,
        effectiveCostOfNewService: effectiveCost,
        reason,
      };
    }
  }

  return bestSuggestion;
}

/**
 * Format a numeric price for display.
 *
 * @param amount  - Dollar amount to format.
 * @param locale  - BCP 47 locale string (default `"en-US"`).
 * @param currency - ISO 4217 currency code (default `"USD"`).
 * @returns Formatted currency string (e.g., `"$1,234.56"`).
 */
export function formatPrice(
  amount: number,
  locale: string = "en-US",
  currency: string = "USD",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Compare two bundles side by side.
 *
 * @param bundleAIds - First bundle's service IDs.
 * @param bundleBIds - Second bundle's service IDs.
 * @returns Comparison with price delta and extra services in bundle B.
 */
export function compareTiers(
  bundleAIds: readonly ServiceId[],
  bundleBIds: readonly ServiceId[],
): TierComparison {
  const bundleA = calculateBundlePrice(bundleAIds);
  const bundleB = calculateBundlePrice(bundleBIds);

  const setA = new Set(bundleAIds);
  const additionalServices = bundleB.services.filter(
    (s) => !setA.has(s.id),
  );

  const priceDifference = roundCents(bundleB.total - bundleA.total);
  const percentageSaved =
    bundleA.subtotal + bundleB.subtotal > 0
      ? roundCents(
          ((bundleA.discountAmount + bundleB.discountAmount) /
            (bundleA.subtotal + bundleB.subtotal)) *
            100,
        )
      : 0;

  return {
    bundleA,
    bundleB,
    priceDifference,
    additionalServices,
    percentageSaved,
  };
}
