import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { resetDailyCounts, rampUpLimits } from "@/lib/outreach/warmup";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TAG = "[CRON OUTREACH WARMUP]";

export const GET = withCronErrorHandler("cron/outreach-warmup", async (request) => {
  const authError = verifyCronSecret(request);
  if (authError) {
    return authError;
  }

  try {
    const resetCount = await resetDailyCounts();
    const rampedCount = await rampUpLimits();

    logger.info(
      `${TAG} Completed: ${resetCount} counts reset, ${rampedCount} limits ramped up`
    );

    return NextResponse.json({
      success: true,
      resetCount,
      rampedCount,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} Fatal error`, error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
