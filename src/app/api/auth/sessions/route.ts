import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getSession, listSessions, revokeSession } from "@/lib/auth";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required").max(200),
});

/**
 * GET /api/auth/sessions
 * List all active sessions for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "auth-sessions", 60);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const currentSession = await getSession();
    if (!currentSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await listSessions(currentSession.accountId);

    // Mark which session is the current one
    const result = sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSession.id,
    }));

    return NextResponse.json({ success: true, data: { sessions: result } });
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[auth/sessions] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/auth/sessions
 * Revoke a specific session by ID.
 * Body: { sessionId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "auth-sessions-revoke", 30);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const currentSession = await getSession();
    if (!currentSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const parsed = revokeSessionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { sessionId } = parsed.data;

    // Prevent revoking the current session via this endpoint (use signout instead)
    if (sessionId === currentSession.id) {
      return NextResponse.json(
        { error: "Cannot revoke the current session. Use sign out instead." },
        { status: 400 },
      );
    }

    const revoked = await revokeSession(sessionId, currentSession.accountId);
    if (!revoked) {
      return NextResponse.json(
        { error: "Session not found or not owned by you" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[auth/sessions] DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 },
    );
  }
}
