import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { getClientBenchmarks } from "@/lib/intelligence/benchmarks";

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const benchmarks = await getClientBenchmarks(clientId);

    const insights = await prisma.predictiveInsight.findMany({
      where: { clientId, dismissed: false },
      orderBy: [{ impact: "desc" }, { confidence: "desc" }],
      take: 10,
    });

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

    response.headers.set("Cache-Control", "private, no-cache");

    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[benchmarks] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarks" },
      { status: 500 }
    );
  }
}
