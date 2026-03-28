import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { processAllCampaignSends } from "@/lib/outreach/sender";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TAG = "[CRON OUTREACH SEND]";

// ---------------------------------------------------------------------------
// GET /api/cron/outreach-send — Process cold outreach campaign sends
//
// Expected to run every 15 minutes during business hours (8am-6pm).
// Finds all active campaigns, calculates daily limits (warmup curve),
// picks pending recipients, and sends via SendGrid.
// ---------------------------------------------------------------------------

export const GET = withCronErrorHandler("cron/outreach-send", async (request) => {
  const authError = verifyCronSecret(request);
  if (authError) {
    return authError;
  }

  try {
    const result = await processAllCampaignSends();

    logger.info(
      `${TAG} Completed: ${result.campaignsProcessed} campaigns, ${result.totalSent} sent, ${result.totalFailed} failed`
    );

    return NextResponse.json({
      success: true,
      campaignsProcessed: result.campaignsProcessed,
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} Fatal error`, error);

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
});
