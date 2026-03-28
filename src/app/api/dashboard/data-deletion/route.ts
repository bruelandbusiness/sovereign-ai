import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

const deletionSchema = z.object({
  confirmation: z.literal("DELETE MY DATA"),
});

/**
 * POST /api/dashboard/data-deletion
 *
 * GDPR / right-to-erasure endpoint.
 * Soft-deletes the client account by marking it as "deleted".
 * Data is retained for 30 days for legal compliance, then purged
 * by the compliance-purge cron job.
 */
export async function POST(request: NextRequest) {
  try {
    const { clientId, accountId } = await requireClient();

    const body = await request.json();
    const parsed = deletionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            'Invalid request. You must send { "confirmation": "DELETE MY DATA" } to proceed.',
        },
        { status: 400 },
      );
    }

    // Soft-delete: update the account role to mark as deleted and record the timestamp.
    // We store deletion metadata on the account so the compliance-purge cron can
    // find accounts scheduled for hard deletion.
    const now = new Date();
    const purgeAfter = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.$transaction([
      // Mark the account as deleted
      prisma.account.update({
        where: { id: accountId },
        data: {
          role: "deleted",
          name: `[DELETION REQUESTED ${now.toISOString()}]`,
        },
      }),

      // Invalidate all sessions for this account
      prisma.session.deleteMany({
        where: { accountId },
      }),

      // Invalidate all unused magic links
      prisma.magicLink.deleteMany({
        where: { accountId, usedAt: null },
      }),

      // Create an audit log entry for compliance
      prisma.auditLog.create({
        data: {
          accountId,
          action: "data_deletion_requested",
          resource: "account",
          resourceId: accountId,
          metadata: JSON.stringify({
            clientId,
            requestedAt: now.toISOString(),
            purgeAfter: purgeAfter.toISOString(),
            confirmation: parsed.data.confirmation,
          }),
        },
      }),
    ]);

    logger.info("[data-deletion] Account marked for deletion", {
      accountId,
      clientId,
      purgeAfter: purgeAfter.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message:
        "Your account has been marked for deletion. All data will be permanently removed after a 30-day grace period. " +
        "If you change your mind, contact support within 30 days to cancel the deletion.",
      purgeAfter: purgeAfter.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause("[data-deletion] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to process deletion request" },
      { status: 500 },
    );
  }
}
