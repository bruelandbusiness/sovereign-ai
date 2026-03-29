import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
/**
 * GET /api/dashboard/qbr/[id] — Get full QBR report detail.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { clientId } = await requireClient();

    const { id } = await params;

    const report = await prisma.qBRReport.findFirst({
      where: { id, clientId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...report,
      metrics: (() => { try { return JSON.parse(report.metrics ?? "{}"); } catch { return {}; } })(),
      highlights: (() => { try { return JSON.parse(report.highlights ?? "[]"); } catch { return []; } })(),
      recommendations: (() => { try { return JSON.parse(report.recommendations ?? "[]"); } catch { return []; } })(),
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    Sentry.captureException(error);
    logger.errorWithCause("[qbr/[id]] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch QBR report" },
      { status: 500 }
    );
  }
}
