import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig: NextConfig = {
  /* ── External packages for server-side bundling ──────────────────────── */
  serverExternalPackages: ["@prisma/client", "better-sqlite3"],

  /* ── Compression ─────────────────────────────────────────────────────── */
  // Next.js enables gzip compression by default; being explicit here so
  // the setting is visible and won't be accidentally overridden.
  compress: true,

  /* ── Security ────────────────────────────────────────────────────────── */
  // Remove the X-Powered-By: Next.js header to reduce information leakage.
  poweredByHeader: false,

  /* ── React strict mode ───────────────────────────────────────────────── */
  reactStrictMode: true,

  /* ── Image optimisation ──────────────────────────────────────────────── */
  images: {
    // Use the modern formats Next.js supports for smaller payloads.
    formats: ["image/avif", "image/webp"],
    // If you later load images from external hosts, add remotePatterns here.
  },

  /* ── Headers (security + cache) ────────────────────────────────────── */
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.googleadservices.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://vitals.vercel-insights.com https://*.sentry.io; frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
    ];

    return [
      {
        // Security headers on all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Hashed static assets (JS, CSS, fonts, images in _next/static)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Public static files (favicon, icons, robots.txt, etc.)
        source: "/:path(favicon\\.ico|icon-.*\\.png|apple-icon\\.png|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Public marketing pages — CDN caches for 1h, stale-while-revalidate for 24h
        source: "/(|about|pricing|services|blog|faq|vs/:path*|results/:path*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  /* ── Sentry build plugin options ─────────────────────────────────────── */
  // Suppress Sentry CLI output during builds.
  silent: true,

  // Upload wider set of client source maps for better stack traces.
  widenClientFileUpload: true,

  // Keep the server-side Webpack plugin enabled for automatic
  // error boundaries and performance tracing.
  disableServerWebpackPlugin: false,
});
