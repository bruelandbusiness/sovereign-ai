/**
 * Feature Gating Service
 *
 * Centralized tier-based access control for all services.
 * Looks up a client's subscription bundle from the database
 * and checks it against the TIER_FEATURES map.
 */

import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BundleId = "diy" | "starter" | "growth" | "empire";

export type Feature =
  | "chatbot"
  | "voice"
  | "crm"
  | "ads"
  | "social"
  | "reviews"
  | "booking"
  | "content"
  | "seo"
  | "outreach"
  | "discovery"
  | "enrichment"
  | "recruiting"
  | "financing"
  | "franchise"
  | "lead-gen"
  | "email"
  | "website"
  | "analytics"
  | "reputation"
  | "retargeting";

// ---------------------------------------------------------------------------
// Feature Map — which features each tier gets
// ---------------------------------------------------------------------------

const TIER_FEATURES: Record<BundleId, ReadonlySet<Feature>> = {
  diy: new Set<Feature>(["chatbot", "reviews", "booking"]),

  starter: new Set<Feature>([
    "chatbot",
    "reviews",
    "booking",
    "lead-gen",
    "outreach",
    "discovery",
  ]),

  growth: new Set<Feature>([
    "chatbot",
    "reviews",
    "booking",
    "lead-gen",
    "outreach",
    "discovery",
    "voice",
    "seo",
    "email",
    "crm",
    "content",
    "social",
    "ads",
    "analytics",
  ]),

  empire: new Set<Feature>([
    "chatbot",
    "voice",
    "crm",
    "ads",
    "social",
    "reviews",
    "booking",
    "content",
    "seo",
    "outreach",
    "discovery",
    "enrichment",
    "recruiting",
    "financing",
    "franchise",
    "lead-gen",
    "email",
    "website",
    "analytics",
    "reputation",
    "retargeting",
  ]),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a client's current bundle from the database. */
async function getClientBundle(
  clientId: string,
): Promise<BundleId | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      clientId,
      status: { in: ["active", "canceling"] },
    },
    orderBy: { createdAt: "desc" },
    select: { bundleId: true, isTrial: true },
  });

  if (!subscription || !subscription.bundleId) {
    return null;
  }

  // Trial subscriptions still get gated access based on their bundle
  const id = subscription.bundleId as string;
  if (id in TIER_FEATURES) {
    return id as BundleId;
  }

  return null;
}

/** Check whether a bundle includes a given feature (pure, no DB). */
export function bundleHasFeature(
  bundleId: BundleId,
  feature: Feature,
): boolean {
  const features = TIER_FEATURES[bundleId];
  return features ? features.has(feature) : false;
}

/** Return all features available for a bundle. */
export function getFeaturesForBundle(bundleId: BundleId): Feature[] {
  const features = TIER_FEATURES[bundleId];
  return features ? [...features] : [];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if a client can access a given feature based on their subscription.
 *
 * Returns `false` when the client has no active subscription or their
 * bundle does not include the requested feature.
 */
export async function canAccessFeature(
  clientId: string,
  feature: string,
): Promise<boolean> {
  const bundleId = await getClientBundle(clientId);
  if (!bundleId) {
    return false;
  }
  return bundleHasFeature(bundleId, feature as Feature);
}

/**
 * Guard that throws a 403-style error when a client lacks access to a feature.
 *
 * Use in API routes and server actions:
 * ```ts
 * await requireFeature(clientId, "voice");
 * ```
 */
export async function requireFeature(
  clientId: string,
  feature: string,
): Promise<void> {
  const allowed = await canAccessFeature(clientId, feature);
  if (!allowed) {
    const error = new Error(
      `Access denied: feature "${feature}" is not available on your current plan. Please upgrade to continue.`,
    );
    (error as Error & { status: number }).status = 403;
    throw error;
  }
}
