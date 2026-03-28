import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
/**
 * GET /api/dashboard/reports — List available report periods.
 */
export async function GET() {
  try {
    await requireClient();

    const now = new Date();
    const currentMonth = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;

    const response = NextResponse.json({
      periods: [
        {
          id: "weekly",
          label: "This Week",
          description: "Last 7 days performance summary",
        },
        {
          id: "monthly",
          label: `This Month (${currentMonth})`,
          description: "Month-to-date performance report",
        },
        {
          id: "quarterly",
          label: `This Quarter (${currentQuarter})`,
          description: "Quarter-to-date comprehensive report",
        },
      ],
    });

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
    logger.errorWithCause("[reports] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
