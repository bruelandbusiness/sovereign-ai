"use client";

import { useEffect, useRef } from "react";
import { trackBlogScrollDepth } from "@/lib/tracking";

interface BlogScrollTrackerProps {
  slug: string;
}

/**
 * Tracks scroll depth on blog posts at 25%, 50%, 75%, and 100% milestones.
 * Fires a GA4 + FB event at each threshold (once per threshold per page load).
 */
export function BlogScrollTracker({ slug }: BlogScrollTrackerProps) {
  const firedRef = useRef(new Set<number>());

  useEffect(() => {
    const thresholds = [25, 50, 75, 100];

    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const threshold of thresholds) {
        if (percent >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold);
          trackBlogScrollDepth(slug, threshold);
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug]);

  return null;
}
