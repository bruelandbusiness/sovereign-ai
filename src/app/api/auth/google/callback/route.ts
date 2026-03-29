import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import {
  findOrCreateAccountByEmail,
  createSession,
  setSessionCookie,
  getAppUrl,
} from "@/lib/auth";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit: 10 OAuth callback attempts per IP per hour
  const { allowed } = await rateLimitByIP(ip, "google-oauth-callback", 10, {
    degradeGracefully: false,
  });
  if (!allowed) {
    return NextResponse.redirect(
      new URL("/login?error=too_many_attempts", request.url)
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  // User denied consent or other Google error
  if (errorParam) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_denied", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_invalid", request.url)
    );
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google-oauth-state")?.value;
  cookieStore.delete("google-oauth-state");

  if (!storedState || storedState !== state) {
    logger.warn("[auth/google] OAuth state mismatch (possible CSRF)", { ip });
    return NextResponse.redirect(
      new URL("/login?error=oauth_state_mismatch", request.url)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_not_configured", request.url)
    );
  }

  // Use the shared getAppUrl() helper to match the initiation route.
  // Both routes must produce the exact same redirect_uri or Google will
  // reject the token exchange with a redirect_uri_mismatch error.
  const redirectUri = `${getAppUrl()}/api/auth/google/callback`;

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      logger.error("Google token exchange failed", {
        status: tokenRes.status,
        body: await tokenRes.text(),
      });
      return NextResponse.redirect(
        new URL("/login?error=oauth_token_failed", request.url)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_token_failed", request.url)
      );
    }

    // Fetch user profile from Google
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_profile_failed", request.url)
      );
    }

    const userInfo: { email?: string; name?: string; verified_email?: boolean } =
      await userRes.json();

    if (!userInfo.email) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_no_email", request.url)
      );
    }

    if (userInfo.verified_email === false) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_unverified_email", request.url)
      );
    }

    const email = userInfo.email.toLowerCase().trim();

    // Find or create account
    const account = await findOrCreateAccountByEmail(email, userInfo.name);

    // Create session with metadata
    const userAgent = request.headers.get("user-agent") || undefined;
    const session = await createSession(account.id, {
      userAgent,
      ipAddress: ip,
    });

    await setSessionCookie(session.token);

    logger.info("[auth/google] Successful OAuth login", {
      accountId: account.id,
      ip,
    });

    // Check for a stored redirect path
    const redirectPath = cookieStore.get("oauth-redirect")?.value;
    cookieStore.delete("oauth-redirect");

    // Validate redirect path to prevent open redirect attacks.
    // Paths like "//evil.com" start with "/" but browsers treat them as
    // protocol-relative URLs. Require single leading slash, no double-slash.
    const isSafeRedirect =
      redirectPath &&
      redirectPath.startsWith("/") &&
      !redirectPath.startsWith("//") &&
      !redirectPath.includes("://");
    const destination = isSafeRedirect ? redirectPath : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
