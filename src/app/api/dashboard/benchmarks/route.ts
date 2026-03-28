import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { getClientBenchmarks } from "@/lib/intelligence/benchmarks";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const [benchmarks, insights] = await Promise.all([
      getClientBenchmarks(clientId),
      prisma.predictiveInsight.findMany({
        where: { clientId, dismissed: false },
        orderBy: [{ impact: "desc" }, { confidence: "desc" }],
        take: 10,
      }),
    ]);

    const response = NextResponse.json({
      benchmarks,
      insights: insights.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description,
        confidence: i.confidence,
        impact: i.impact,
        recommendation: i.recommendation,
        actionUrl: i.actionUrl,
        dismissed: i.dismissed,
      })),
    });

    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=30");

    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[benchmarks] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarks" },
      { status: 500 }
    );
  }
}
