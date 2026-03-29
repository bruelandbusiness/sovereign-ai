"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Lazy-loaded PostHog page-view tracker.
 *
 * The posthog-js library is dynamically imported so it is NOT included in the
 * initial JavaScript bundle (~45 KiB gzipped savings). The library loads after
 * hydration via the dynamic import in PostHogProvider below.
 */
function PostHogPageView(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogRef = useRef<typeof import("posthog-js").default | null>(null);

  useEffect(() => {
    // Dynamically import posthog-js so it is code-split from the main bundle
    import("posthog-js").then((mod) => {
      posthogRef.current = mod.default;
    });
  }, []);

  useEffect(() => {
    const ph = posthogRef.current;
    if (!ph || !ph.__loaded) {
      return;
    }

    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

interface PostHogProviderProps {
  readonly children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Dynamically import posthog-js and the init helper so the ~45 KiB
    // posthog-js library is loaded after hydration, not in the initial bundle.
    import("@/lib/posthog").then(({ initPostHog }) => {
      initPostHog();
      setReady(true);
    });
  }, []);

  return (
    <>
      {ready && (
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
      )}
      {children}
    </>
  );
}
