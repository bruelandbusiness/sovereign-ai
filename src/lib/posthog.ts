import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * Initialize PostHog on the client side.
 * Returns the PostHog instance, or null when the API key is not configured.
 */
export function initPostHog(): typeof posthog | null {
  if (!POSTHOG_KEY) {
    return null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  if (!posthog.__loaded) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false, // we handle this manually in the provider
      capture_pageleave: true,
    });
  }

  return posthog;
}

export { posthog };
