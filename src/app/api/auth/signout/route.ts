import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/auth";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 requests per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimitByIP(ip, "auth-signout", 30);
    if (!rl.allowed) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        ),
        rl
      );
    }

    await signOut();
    logger.info("[auth/signout] User signed out", { ip });
    return setRateLimitHeaders(NextResponse.json({ success: true }), rl);
  } catch (error) {
    logger.error("POST /api/auth/signout failed", { error });
    // Still clear the cookie even if the DB delete failed, so the user is
    // logged out client-side and not stuck in a broken state.
    const { clearSessionCookie } = await import("@/lib/auth");
    await clearSessionCookie().catch(() => {});
    return NextResponse.json({ success: true });
  }
}
