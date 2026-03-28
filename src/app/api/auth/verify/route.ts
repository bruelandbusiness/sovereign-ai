import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink, setSessionCookie } from "@/lib/auth";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 10 verify attempts per IP per hour to prevent token brute-force
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimitByIP(ip, "auth-verify", 10, {
      degradeGracefully: false,
    });
    if (!rl.allowed) {
      logger.warn("[auth/verify] Rate limit exceeded", { ip, action: "auth-verify" });
      const res = NextResponse.redirect(
        new URL("/login?error=too_many_attempts", request.url)
      );
      return setRateLimitHeaders(res, rl);
    }

    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=missing_token", request.url)
      );
    }

    // Validate token format: must be exactly 64 hex characters (32 bytes)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_or_expired", request.url)
      );
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    const result = await verifyMagicLink(token, { userAgent, ipAddress: ip });

    if (!result) {
      logger.warn("[auth/verify] Invalid or expired magic link token", { ip });
      return NextResponse.redirect(
        new URL("/login?error=invalid_or_expired", request.url)
      );
    }

    await setSessionCookie(result.session.token);

    logger.info("[auth/verify] Successful login", {
      accountId: result.account.id,
      ip,
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    logger.error("GET /api/auth/verify failed", { error });
    return NextResponse.redirect(
      new URL("/login?error=invalid_or_expired", request.url)
    );
  }
}
