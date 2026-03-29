/**
 * Runtime Feature Flags
 *
 * Complementary to feature-gate.ts (tier-based subscription access control),
 * this module provides runtime feature toggles for gradual rollouts,
 * A/B testing, and client-specific feature enablement.
 *
 * Use feature-gate.ts to check subscription entitlements.
 * Use feature-flags.ts to toggle platform capabilities at runtime.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // 0-100 for gradual rollout
  allowedClientIds?: string[]; // Whitelist specific clients
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Default Feature Flags
// ---------------------------------------------------------------------------

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  "ai-voice-v2": {
    key: "ai-voice-v2",
    enabled: false,
    description: "Next-gen AI voice agent with real-time conversation",
    rolloutPercentage: 0,
    createdAt: "2026-01-15T00:00:00Z",
  },
  "smart-scheduling": {
    key: "smart-scheduling",
    enabled: true,
    description: "AI-powered appointment scheduling optimization",
    createdAt: "2025-09-01T00:00:00Z",
  },
  "revenue-dashboard": {
    key: "revenue-dashboard",
    enabled: true,
    description: "Advanced revenue analytics dashboard",
    createdAt: "2025-10-10T00:00:00Z",
  },
  "bulk-outreach": {
    key: "bulk-outreach",
    enabled: false,
    description: "Bulk SMS/email outreach campaigns",
    rolloutPercentage: 25,
    createdAt: "2026-02-01T00:00:00Z",
  },
  "ai-review-responses": {
    key: "ai-review-responses",
    enabled: true,
    description: "Auto-generate review responses using AI",
    createdAt: "2025-11-20T00:00:00Z",
  },
  "predictive-lead-scoring": {
    key: "predictive-lead-scoring",
    enabled: false,
    description: "ML-based lead scoring and prioritization",
    rolloutPercentage: 50,
    createdAt: "2026-03-01T00:00:00Z",
  },
  "multi-location-sync": {
    key: "multi-location-sync",
    enabled: false,
    description: "Sync settings and campaigns across multiple locations",
    rolloutPercentage: 10,
    createdAt: "2026-03-15T00:00:00Z",
  },
  "conversation-insights": {
    key: "conversation-insights",
    enabled: true,
    description: "AI-powered conversation analytics and sentiment tracking",
    createdAt: "2025-12-05T00:00:00Z",
  },
  "automated-follow-ups": {
    key: "automated-follow-ups",
    enabled: false,
    description: "Trigger follow-up sequences based on customer behavior",
    rolloutPercentage: 30,
    allowedClientIds: ["client_beta_001", "client_beta_002"],
    createdAt: "2026-02-20T00:00:00Z",
  },
};

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Produce a deterministic number 0-99 from a client ID string.
 * Uses a simple djb2-style hash to distribute clients uniformly.
 */
function hashClientId(clientId: string): number {
  let hash = 5381;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 33) ^ clientId.charCodeAt(i);
  }
  return Math.abs(hash) % 100;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if a feature flag is enabled for a specific client.
 *
 * Evaluation order:
 * 1. If the flag does not exist, return false.
 * 2. If the flag is globally disabled (`enabled: false`) and has no
 *    rollout or whitelist, return false.
 * 3. If `allowedClientIds` is set and the client is in the list,
 *    return true (bypasses rollout percentage).
 * 4. If `rolloutPercentage` is set and a `clientId` is provided,
 *    hash the client ID and compare against the percentage.
 * 5. Fall back to the flag's `enabled` value.
 */
export function isFeatureEnabled(
  flagKey: string,
  clientId?: string,
): boolean {
  const flag = FEATURE_FLAGS[flagKey];
  if (!flag) {
    return false;
  }

  // Whitelist check — allowed clients always get the feature
  if (
    clientId &&
    flag.allowedClientIds &&
    flag.allowedClientIds.includes(clientId)
  ) {
    return true;
  }

  // Percentage-based rollout
  if (
    flag.rolloutPercentage !== undefined &&
    flag.rolloutPercentage > 0 &&
    clientId
  ) {
    return hashClientId(clientId) < flag.rolloutPercentage;
  }

  return flag.enabled;
}

/**
 * Get all enabled feature flag keys for a given client.
 */
export function getEnabledFeatures(clientId?: string): string[] {
  return Object.keys(FEATURE_FLAGS).filter((key) =>
    isFeatureEnabled(key, clientId),
  );
}
