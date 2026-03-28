import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { processOutreachStep } from "@/lib/outreach";
import type { OutreachEntryWithSequence } from "@/lib/outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TAG = "[CRON OUTREACH PROCESS]";
const MAX_PER_RUN = 100;

export const GET = withCronErrorHandler("cron/outreach-process", async (request) => {
  const authError = verifyCronSecret(request);
  if (authError) {
    return authError;
  }

  try {
    const now = new Date();

    const entries = await prisma.outreachEntry.findMany({
      where: {
        status: "active",
        nextStepAt: { lte: now },
      },
      include: {
        sequence: true,
      },
      orderBy: { nextStepAt: "asc" },
      take: MAX_PER_RUN,
    });

    let processed = 0;
    let errored = 0;

    for (const entry of entries) {
      // Skip entries whose sequence is inactive
      if (!entry.sequence.isActive) {
        continue;
      }

      try {
        await processOutreachStep(entry as OutreachEntryWithSequence);
        processed++;
      } catch (error) {
        errored++;
        logger.errorWithCause(
          `${TAG} Error processing entry ${entry.id}`,
          error,
          { entryId: entry.id, sequenceId: entry.sequenceId }
        );
      }
    }

    logger.info(
      `${TAG} Completed: ${processed} processed, ${errored} errors out of ${entries.length} entries`
    );

    return NextResponse.json({
      success: true,
      found: entries.length,
      processed,
      errored,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} Fatal error`, error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
