import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { generateReportHTML } from "@/lib/pdf-report";
import { rateLimitByIP } from "@/lib/rate-limit";

/**
 * GET /api/dashboard/reports/generate?period=weekly|monthly|quarterly
 *
 * Returns a complete print-optimized HTML report the client can open
 * in a new tab and save as PDF via Ctrl+P / Cmd+P.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 20 report generations per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "report-generate", 20);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { clientId } = await requireClient();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") as "weekly" | "monthly" | "quarterly" | null;

    if (!period || !["weekly", "monthly", "quarterly"].includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Must be weekly, monthly, or quarterly." },
        { status: 400 }
      );
    }

    const html = await generateReportHTML(clientId, period);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[reports/generate] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
