import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { calculateROI } from "@/lib/roi";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { clientId } = await requireClient();

    // Last 30 days
    const periodEnd = new Date();
    const periodStart = new Date(
      periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000,
    );

    const data = await calculateROI(clientId, periodStart, periodEnd);

    // Convert from cents to dollars for the dashboard
    const investment = data.totalSpend / 100;
    const revenue = data.totalRevenue / 100;
    const roi = data.roi;

    const response = NextResponse.json({ investment, revenue, roi });

    response.headers.set(
      "Cache-Control",
      "private, max-age=120, stale-while-revalidate=60"
    );

    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[roi] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch ROI data" },
      { status: 500 },
    );
  }
}
