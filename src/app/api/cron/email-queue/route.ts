import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron";
import { processEmailQueue } from "@/lib/email-queue";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) {
    return authError;
  }

  try {
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
  } catch (error) {
    logger.errorWithCause("[CRON EMAIL QUEUE] Error processing email queue", error);

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
