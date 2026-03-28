"use client";

import Script from "next/script";

/**
 * Vercel Web Analytics + Speed Insights for Core Web Vitals monitoring.
 * Loads the lightweight Vercel analytics script in production.
 * Add <Analytics /> to the root layout.
 */
export function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      {/* Vercel Web Analytics */}
      <Script
        src="/_vercel/insights/script.js"
        strategy="afterInteractive"
        data-sdkn="@vercel/analytics"
      />
      {/* Vercel Speed Insights — Core Web Vitals */}
      <Script
        src="/_vercel/speed-insights/script.js"
        strategy="afterInteractive"
        data-sdkn="@vercel/speed-insights"
      />
    </>
  );
}
