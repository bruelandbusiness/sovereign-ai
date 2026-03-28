import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

/**
 * GET /api/compliance/status/[clientId]
 * Full compliance status dashboard: config, stats, recent contact attempts,
 * suppression list size, consent breakdown.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId: sessionClientId } = await requireClient();
    const { clientId } = await params;

    if (sessionClientId !== clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [config, suppressionCount, consentsByChannel, recentAttempts, blockedCount] =
      await Promise.all([
        prisma.complianceConfig.findUnique({ where: { clientId } }),

        prisma.suppressionList.count({ where: { clientId } }),

        prisma.consentRecord.groupBy({
          by: ["channel"],
          where: { clientId, revokedAt: null },
          _count: { id: true },
        }),

        prisma.contactAttemptLog.findMany({
          where: { clientId },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),

        prisma.contactAttemptLog.count({
          where: { clientId, status: "blocked" },
        }),
      ]);

    const totalConsents = consentsByChannel.reduce(
      (sum, c) => sum + c._count.id,
      0
    );

    return NextResponse.json({
      configured: !!config,
      config,
      stats: {
        suppressedContacts: suppressionCount,
        totalActiveConsents: totalConsents,
        consentsByChannel: Object.fromEntries(
          consentsByChannel.map((c) => [c.channel, c._count.id])
        ),
        totalBlockedAttempts: blockedCount,
      },
      recentAttempts,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.errorWithCause("[compliance/status] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance status" },
      { status: 500 }
    );
  }
}
