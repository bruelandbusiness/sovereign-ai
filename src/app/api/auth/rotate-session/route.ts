import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { rotateSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const SESSION_COOKIE = "sovereign-session";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Auth endpoints must fail closed — block if rate limiter errors.
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimitByIP(ip, "auth-rotate-session", 30, {
      degradeGracefully: false,
    });
    if (!rl.allowed) {
      return setRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        rl
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const newToken = await rotateSession(token);
    if (!newToken) {
      return NextResponse.json({ error: "Session invalid" }, { status: 401 });
    }

    return setRateLimitHeaders(NextResponse.json({ ok: true }), rl);
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("Session rotation failed:", error);
    return NextResponse.json(
      { error: "Session rotation failed" },
      { status: 500 }
    );
  }
}
