import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { runGuaranteeCheck } from "@/lib/operations/guarantee-checker";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const GET = withCronErrorHandler("cron/guarantee-check", async (request) => {
  const authError = verifyCronSecret(request);
  if (authError) {
    return authError;
  }

  try {
    const result = await runGuaranteeCheck();

    logger.info(
      `[CRON GUARANTEE CHECK] ${result.processed} clients: ${result.met} met, ${result.credited} credited, ${result.fullCredited} full-credited`
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.errorWithCause("[CRON GUARANTEE CHECK] Error", error);

    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
});
