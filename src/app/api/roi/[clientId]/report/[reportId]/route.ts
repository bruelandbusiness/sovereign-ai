import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; reportId: string }> },
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { clientId: routeClientId, reportId } = await params;

  // Clients can only access their own reports
  if (clientId !== routeClientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const report = await prisma.rOIReport.findFirst({
      where: { id: reportId, clientId },
      select: {
        id: true,
        clientId: true,
        periodType: true,
        periodStart: true,
        periodEnd: true,
        totalLeads: true,
        totalBookings: true,
        totalRevenue: true,
        totalSpend: true,
        roi: true,
        channelBreakdown: true,
        sourceBreakdown: true,
        generatedAt: true,
        sentAt: true,
        createdAt: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      id: report.id,
      clientId: report.clientId,
      periodType: report.periodType,
      periodStart: report.periodStart.toISOString(),
      periodEnd: report.periodEnd.toISOString(),
      totalLeads: report.totalLeads,
      totalBookings: report.totalBookings,
      totalRevenue: report.totalRevenue,
      totalSpend: report.totalSpend,
      roi: report.roi,
      channelBreakdown: report.channelBreakdown
        ? JSON.parse(report.channelBreakdown)
        : [],
      sourceBreakdown: report.sourceBreakdown
        ? JSON.parse(report.sourceBreakdown)
        : [],
      generatedAt: report.generatedAt.toISOString(),
      sentAt: report.sentAt?.toISOString() ?? null,
      createdAt: report.createdAt.toISOString(),
    });
    response.headers.set("Cache-Control", "private, max-age=300, stale-while-revalidate=60");
    return response;
  } catch (error) {
    logger.errorWithCause("[api/roi/report] Failed to fetch report", error, {
      clientId,
      reportId,
    });
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 },
    );
  }
}
