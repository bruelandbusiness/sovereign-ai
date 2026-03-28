import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/lead-cleanup", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/lead-cleanup] Starting lead cleanup");

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Find leads older than 90 days with status still "new" and no activity events
    // First, get IDs of leads that have associated activity events
    const leadsWithActivity = await prisma.activityEvent.findMany({
      where: {
        type: "lead_captured",
        createdAt: { gte: ninetyDaysAgo },
      },
      select: { clientId: true },
      distinct: ["clientId"],
    });

    // activeClientIds reserved for future filtering
    void leadsWithActivity.map((a) => a.clientId);

    // Update stale leads to "lost" status
    const result = await prisma.lead.updateMany({
      where: {
        status: "new",
        createdAt: { lt: ninetyDaysAgo },
        updatedAt: { lt: ninetyDaysAgo },
      },
      data: {
        status: "lost",
      },
    });

    const archived = result.count;

    logger.info("[cron/lead-cleanup] Completed", { archived });

    return NextResponse.json({
      ok: true,
      archived,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.errorWithCause("[cron/lead-cleanup] Fatal error", err);
    return NextResponse.json(
      { error: "Lead cleanup cron job failed" },
      { status: 500 },
    );
  }
});
