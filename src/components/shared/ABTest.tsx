"use client";

import { useFeatureFlag } from "@/hooks/useFeatureFlag";

interface ABTestProps {
  /** PostHog feature flag key. */
  readonly flagKey: string;
  /** Rendered when the flag is off (or while loading). */
  readonly control: React.ReactNode;
  /** Rendered when the flag is on. */
  readonly variant: React.ReactNode;
}

/**
 * A/B test wrapper component.
 *
 * Shows `control` by default and switches to `variant` when the PostHog
 * feature flag identified by `flagKey` evaluates to `true`.
 */
export function ABTest({ flagKey, control, variant }: ABTestProps) {
  const isVariant = useFeatureFlag(flagKey, false);

  return <>{isVariant ? variant : control}</>;
}
