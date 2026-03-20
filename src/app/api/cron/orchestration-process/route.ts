import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron";
import { processEvents } from "@/lib/orchestration/processor";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await processEvents();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/orchestration-process] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
