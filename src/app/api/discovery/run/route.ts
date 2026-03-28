import { NextResponse } from "next/server";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { logger } from "@/lib/logger";
import { runDiscoveryForClient } from "@/lib/discovery";

export const dynamic = "force-dynamic";
/**
 * POST: Manually trigger a discovery run for the authenticated client.
 */
export async function POST() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    logger.info("[api/discovery/run] Manual discovery run triggered", {
      clientId,
    });

    const result = await runDiscoveryForClient(clientId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.errorWithCause("[api/discovery/run] POST failed", error);
    return NextResponse.json(
      { error: "Discovery run failed" },
      { status: 500 },
    );
  }
}
