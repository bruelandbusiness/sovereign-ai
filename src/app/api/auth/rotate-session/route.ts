import { NextRequest, NextResponse } from "next/server";
import { rotateSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { rateLimitByIP } from "@/lib/rate-limit";

const SESSION_COOKIE = "sovereign-session";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Auth endpoints must fail closed — block if rate limiter errors.
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "auth-rotate-session", 30, {
      degradeGracefully: false,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session rotation failed:", error);
    return NextResponse.json(
      { error: "Session rotation failed" },
      { status: 500 }
    );
  }
}
