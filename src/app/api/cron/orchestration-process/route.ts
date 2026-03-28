import { NextResponse } from "next/server";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { processEvents } from "@/lib/orchestration/processor";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronMonitoring("cron/orchestration-process", async (_request) => {

  try {
    const result = await processEvents();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.errorWithCause("[cron/orchestration-process] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
});
