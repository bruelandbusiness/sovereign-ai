import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require("@sentry/nextjs") as {
  withSentryConfig: <C>(config: C, options?: Record<string, unknown>) => C;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
}) as <C>(config: C) => C;

const nextConfig: NextConfig = {
  /* ── External packages for server-side bundling ──────────────────────── */
  serverExternalPackages: ["@prisma/client", "better-sqlite3"],

  /* ── Output file tracing exclusions ────────────────────────────────── */
  // Exclude heavy server-only artefacts from the client bundle trace.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
      "node_modules/@esbuild",
      "node_modules/sharp",
      "node_modules/prisma/libquery_engine-*",
    ],
  },

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
    // Cache optimised images server-side for 24 hours (default is 60s).
    minimumCacheTTL: 86400,
    // Allow agency logos and user-uploaded images from any HTTPS host.
    // Components that load external URLs: AgencyDashboard (logoUrl),
    // BlogCard (post.image), AvatarGroup (avatar.src), KanbanBoard (item.avatar).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  /* ── Security + Cache headers ────────────────────────────────────── */
  async headers() {
    return [
      {
        // All routes except /embed/* get strict framing protection.
        source: "/((?!embed/).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        // Embeddable widget scripts and their backing API endpoints are loaded
        // cross-origin. They must NOT carry X-Frame-Options: DENY because
        // clients may preview their embed inside an iframe. We only apply the
        // security headers that are safe for cross-origin use.
        source: "/embed/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
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
        source: "/(|about|pricing|services|blog|faq|vs/:path*|results/:path*|knowledge|community|marketplace|careers)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Next.js optimised images — cache at CDN for 24h, browser for 1h
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Google Fonts and other external font files
        source: "/:path*.woff2",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Font files (woff)
        source: "/:path*.woff",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Font files (ttf)
        source: "/:path*.ttf",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Font files (otf)
        source: "/:path*.otf",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Font files (eot)
        source: "/:path*.eot",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // Upload source maps to Sentry for readable stack traces in production
  silent: !process.env.CI,

  // Automatically associate commits and releases
  release: {
    name: process.env.VERCEL_GIT_COMMIT_SHA,
  },

  // Hide source maps from the client bundle in production
  hideSourceMaps: true,

  // Widen the upload scope to include server-side source maps
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements in production
  disableLogger: true,

  // Use the build-time tunnel to avoid ad blockers on the client
  tunnelRoute: "/monitoring-tunnel",
});
