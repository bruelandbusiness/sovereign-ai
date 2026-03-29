import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/snapshots/[token]
 *
 * Public endpoint: view a dashboard snapshot by its share token.
 * No authentication required. Increments viewCount on each access.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "dashboard-snapshot-get", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;

  try {
    const snapshot = await prisma.dashboardSnapshot.findUnique({
      where: { token },
      select: {
        id: true,
        businessName: true,
        snapshotDate: true,
        expiresAt: true,
        revoked: true,
        data: true,
        viewCount: true,
      },
    });

    if (!snapshot || snapshot.revoked) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 },
      );
    }

    if (snapshot.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This snapshot has expired" },
        { status: 410 },
      );
    }

    // Fire-and-forget view count increment
    prisma.dashboardSnapshot
      .update({
        where: { id: snapshot.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((updateErr: unknown) =>
        logger.errorWithCause(
          "[dashboard-snapshot] View count update failed:",
          updateErr instanceof Error ? updateErr.message : updateErr,
        ),
      );

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(snapshot.data);
    } catch {
      parsedData = {};
    }

    const response = NextResponse.json({
      businessName: snapshot.businessName,
      snapshotDate: snapshot.snapshotDate.toISOString(),
      expiresAt: snapshot.expiresAt.toISOString(),
      viewCount: snapshot.viewCount + 1,
      ...(parsedData as Record<string, unknown>),
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );

    return response;
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[dashboard-snapshot] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
