"use client";

import { useEffect } from "react";
import { captureUtmParams } from "@/lib/tracking";

/**
 * Captures UTM parameters from the URL on initial page load and stores
 * them in sessionStorage so they persist through the funnel. Add this
 * component to the root layout alongside TrackingScripts.
 */
export function UtmCapture() {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return null;
}
