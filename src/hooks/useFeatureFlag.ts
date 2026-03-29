"use client";

import { useState, useEffect, useRef } from "react";

type PostHogInstance = typeof import("posthog-js").default;

/**
 * Lazily resolve the PostHog singleton.
 * Uses dynamic import so posthog-js stays out of the initial bundle.
 */
function usePostHog(): PostHogInstance | null {
  const ref = useRef<PostHogInstance | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("posthog-js").then((mod) => {
      if (cancelled) return;
      const ph = mod.default;
      if (ph.__loaded) {
        ref.current = ph;
        setReady(true);
      } else {
        // PostHog may not be initialised yet; poll briefly.
        const id = setInterval(() => {
          if (ph.__loaded) {
            ref.current = ph;
            setReady(true);
            clearInterval(id);
          }
        }, 100);
        // Give up after 5 seconds to avoid leaking the interval.
        setTimeout(() => {
          clearInterval(id);
        }, 5_000);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return ready ? ref.current : null;
}

/**
 * Boolean feature flag hook.
 *
 * Returns `defaultValue` while PostHog is loading or if the flag is not
 * defined.  Once the flag value is resolved it is cached for the remainder
 * of the component lifecycle so the UI does not flicker.
 */
export function useFeatureFlag(
  flagKey: string,
  defaultValue: boolean = false,
): boolean {
  const posthog = usePostHog();
  const cached = useRef<boolean | null>(null);
  const [value, setValue] = useState<boolean>(defaultValue);

  useEffect(() => {
    if (cached.current !== null) return;
    if (!posthog) return;

    const result = posthog.isFeatureEnabled(flagKey);
    const resolved =
      typeof result === "boolean" ? result : defaultValue;
    cached.current = resolved;
    setValue(resolved);
  }, [posthog, flagKey, defaultValue]);

  return cached.current ?? value;
}

/**
 * Multivariate feature flag hook.
 *
 * Returns `defaultValue` (typically `"control"`) while PostHog is loading
 * or if the flag is not defined.  The resolved variant string is cached to
 * prevent flickering.
 */
export function useFeatureFlagVariant(
  flagKey: string,
  defaultValue: string = "control",
): string {
  const posthog = usePostHog();
  const cached = useRef<string | null>(null);
  const [value, setValue] = useState<string>(defaultValue);

  useEffect(() => {
    if (cached.current !== null) return;
    if (!posthog) return;

    const result = posthog.getFeatureFlag(flagKey);
    const resolved =
      typeof result === "string" ? result : defaultValue;
    cached.current = resolved;
    setValue(resolved);
  }, [posthog, flagKey, defaultValue]);

  return cached.current ?? value;
}
