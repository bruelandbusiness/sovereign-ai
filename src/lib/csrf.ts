import { NextRequest } from "next/server";

/**
 * CSRF protection via Origin header validation.
 *
 * For a Next.js app that sets SameSite=Lax cookies, verifying the Origin
 * header on state-changing requests (POST/PUT/PATCH/DELETE) is the
 * recommended CSRF mitigation strategy.
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

const ALLOWED_ORIGINS = new Set([
  "https://www.trysovereignai.com",
  "https://trysovereignai.com",
  // Allow localhost in development
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
]);

// Allow overriding via environment variable (e.g. preview deployments).
// Check both APP_URL (server-only, preferred) and NEXT_PUBLIC_APP_URL (compat).
if (process.env["APP_URL"]) {
  ALLOWED_ORIGINS.add(process.env["APP_URL"]);
}
if (process.env.NEXT_PUBLIC_APP_URL) {
  ALLOWED_ORIGINS.add(process.env.NEXT_PUBLIC_APP_URL);
}

/**
 * Validate that the request's Origin header matches an allowed origin.
 * Should be called at the top of all POST/PUT/PATCH/DELETE API route handlers.
 *
 * @returns `null` if valid, or an error message string if invalid.
 */
export function validateOrigin(request: NextRequest): string | null {
  const method = request.method.toUpperCase();

  // Only check state-changing methods
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");

  // If there's no Origin header, check Referer as a fallback.
  // Browsers always send Origin on cross-origin requests and same-origin
  // POST/PUT/DELETE in modern browsers. A missing Origin on a state-changing
  // request from a browser is suspicious, but some legitimate clients (e.g.
  // server-to-server) won't send it — allow if no origin AND no referer
  // (non-browser client).
  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) {
      // Likely a non-browser client (e.g. curl, Postman, server-to-server).
      // These are not vulnerable to CSRF. Allow through.
      return null;
    }

    // Has a Referer but no Origin — check the Referer domain.
    try {
      const refererOrigin = new URL(referer).origin;
      if (ALLOWED_ORIGINS.has(refererOrigin)) {
        return null;
      }
    } catch {
      // Malformed Referer
    }

    return "Missing or invalid Origin header";
  }

  if (ALLOWED_ORIGINS.has(origin)) {
    return null;
  }

  return `Origin "${origin}" is not allowed`;
}
