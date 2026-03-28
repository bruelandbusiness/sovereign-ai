import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { processFollowUpStep } from "@/lib/followup";

export const dynamic = "force-dynamic";
const TAG = "[cron/followup-process]";

export const maxDuration = 300;

/**
 * Cron endpoint: process due follow-up entries.
 *
 * Finds entries where nextStepAt <= now and status = "active".
 * Processes each with individual try-catch. Max 100 per run.
 */
export const GET = withCronErrorHandler("cron/followup-process", async (request) => {
  const authError = verifyCronSecret(request);
  if (authError) {
    return authError;
  }

  try {
    const now = new Date();

    const entries = await prisma.followUpEntry.findMany({
      where: {
        status: "active",
        nextStepAt: { lte: now },
      },
      include: {
        sequence: {
          select: {
            id: true,
            clientId: true,
            name: true,
            triggerType: true,
            isActive: true,
            steps: true,
          },
        },
      },
      orderBy: { nextStepAt: "asc" },
      take: 100,
    });

    if (entries.length === 0) {
      return NextResponse.json({ success: true, processed: 0, errors: 0 });
    }

    logger.info(`${TAG} Processing ${entries.length} due follow-up entries`);

    let processed = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const entry of entries) {
      try {
        // Skip entries whose sequence has been deactivated
        if (!entry.sequence.isActive) {
          await prisma.followUpEntry.update({
            where: { id: entry.id },
            data: { status: "paused", nextStepAt: null },
          });
          logger.info(
            `${TAG} Paused entry ${entry.id} — sequence ${entry.sequenceId} deactivated`,
          );
          continue;
        }

        await processFollowUpStep(entry);
        processed++;
      } catch (err) {
        errors++;
        const message =
          err instanceof Error ? err.message : "Unknown error";
        errorDetails.push(`Entry ${entry.id}: ${message}`);
        logger.errorWithCause(
          `${TAG} Failed to process entry ${entry.id}`,
          err,
        );
      }
    }

    logger.info(
      `${TAG} Completed: ${processed} processed, ${errors} errors out of ${entries.length} entries`,
    );

    return NextResponse.json({
      success: true,
      processed,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} Fatal error`, error);
    return NextResponse.json(
      { success: false, error: "Follow-up processing cron failed" },
      { status: 500 },
    );
  }
});
