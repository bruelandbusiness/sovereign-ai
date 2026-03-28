import { NextResponse } from "next/server";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { processEmailQueue } from "@/lib/email-queue";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withCronMonitoring("cron/email-queue", async (_request) => {

  const { sent, failed, recovered } = await processEmailQueue();

  logger.info(
    `[CRON EMAIL QUEUE] Processed: ${sent} sent, ${failed} failed, ${recovered} recovered from stuck`
  );

  return NextResponse.json({
    success: true,
    sent,
    failed,
    recovered,
  });
});
