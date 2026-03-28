import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "auth-session", 120);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const session = await getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized", user: null }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.account.id,
        email: session.account.email,
        name: session.account.name,
        role: session.account.role,
        client: session.account.client
          ? {
              id: session.account.client.id,
              businessName: session.account.client.businessName,
              ownerName: session.account.client.ownerName,
              vertical: session.account.client.vertical,
              city: session.account.client.city,
              state: session.account.client.state,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error("GET /api/auth/session failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
