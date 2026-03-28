import { NextRequest, NextResponse } from "next/server";
import { validateOrigin } from "@/lib/csrf";
import * as Sentry from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// Body size limit (1 MB) — reject oversized payloads early in middleware
// ---------------------------------------------------------------------------
const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MB

// ---------------------------------------------------------------------------
// CSP directive (built once at module load, not per-request)
// ---------------------------------------------------------------------------
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://assets.calendly.com https://widget.intercom.io https://www.googletagmanager.com https://connect.facebook.net https://us-assets.i.posthog.com https://*.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.stripe.com https://*.intercom.io wss://*.intercom.io https://*.sentry.io https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://us.i.posthog.com https://us-assets.i.posthog.com https://*.vercel-insights.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://js.stripe.com https://calendly.com https://assets.calendly.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // ── Body size check (API routes only) ─────────────────────────────────
    if (pathname.startsWith("/api/")) {
      const contentLength = request.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        return NextResponse.json(
          { error: "Request body too large. Maximum size is 1MB." },
          { status: 413 }
        );
      }
    }

    // ── Embed API routes (cross-origin from customer sites) ───────────────
    const isEmbedApiRoute =
      pathname.startsWith("/api/services/chatbot/") ||
      pathname.startsWith("/api/services/booking/") ||
      pathname.startsWith("/api/services/social-proof/") ||
      pathname.startsWith("/api/estimate/");

    // ── CSRF protection for state-changing requests to API routes ─────────
    if (
      pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/payments/webhooks") &&
      !isEmbedApiRoute &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
    ) {
      const csrfError = validateOrigin(request);
      if (csrfError) {
        return NextResponse.json(
          { error: "CSRF validation failed", detail: csrfError },
          { status: 403 }
        );
      }
    }

    // ── Auth: protect /dashboard and /admin ───────────────────────────────
    const sessionToken = request.cookies.get("sovereign-session")?.value;

    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin")
    ) {
      if (!sessionToken) {
        // API-style fetches should get a 401 JSON response, not a redirect.
        const accept = request.headers.get("accept") ?? "";
        if (
          accept.includes("application/json") &&
          !accept.includes("text/html")
        ) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }

        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Redirect logged-in users away from login
    if (pathname.startsWith("/login") && sessionToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    const response = NextResponse.next();

    // ── Embed-facing API routes ───────────────────────────────────────────
    // Must not carry restrictive CORP/COOP/X-Frame-Options headers.
    // Basic security headers are already set by next.config.ts headers().
    if (isEmbedApiRoute) {
      response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
      return response;
    }

    // ── Headers only the middleware can set (not duplicated from next.config.ts) ──
    // next.config.ts headers() already sets: X-Content-Type-Options,
    // X-Frame-Options, X-XSS-Protection, Referrer-Policy,
    // Permissions-Policy, Strict-Transport-Security.
    // Middleware adds the headers that next.config.ts does not cover.
    response.headers.set("X-DNS-Prefetch-Control", "on");
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    response.headers.set("Content-Security-Policy", CSP_HEADER);

    return response;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { location: "middleware" },
      extra: { pathname: request.nextUrl.pathname, method: request.method },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Matcher: only run middleware on routes that need it.
//
// Auth routes (/dashboard, /admin, /login) need session checks.
// API routes need CSRF validation, body-size limits, and embed CORS headers.
// All matched routes get CSP + extra security headers.
//
// Excluded: static assets, images, fonts, public files, embed pages.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     *   - _next/static  (Next.js static chunks)
     *   - _next/image   (Next.js image optimisation)
     *   - favicon.ico, icon-*, apple-icon* (favicons / PWA icons)
     *   - *.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp, *.ico (public images)
     *   - *.woff, *.woff2, *.ttf, *.otf, *.eot (fonts)
     *   - sw.js, robots.txt, sitemap.xml, manifest.webmanifest (public files)
     *   - embed/ (embeddable widget pages — handled by next.config.ts headers)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon-|apple-icon|embed/|sw\\.js|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)",
  ],
};
