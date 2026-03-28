import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
/**
 * GET /api/dashboard/qbr — List QBR reports for the authenticated client.
 */
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const reports = await prisma.qBRReport.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        quarter: true,
        summary: true,
        sentAt: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json(reports);
    response.headers.set("Cache-Control", "private, max-age=300, stale-while-revalidate=60");
    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[qbr] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch QBR reports" },
      { status: 500 }
    );
  }
}
