import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — Voice agent dashboard API
//
// Returns call history for the client with pagination, search, and stats.
// Auth required.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const url = request.nextUrl;

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10))
  );
  const search = url.searchParams.get("search") ?? "";
  const offset = (page - 1) * limit;

  // Build where clause
  interface CallWhere {
    clientId: string;
    OR?: Array<{
      from?: { contains: string };
      to?: { contains: string };
      summary?: { contains: string };
    }>;
  }

  const where: CallWhere = { clientId };

  if (search) {
    where.OR = [
      { from: { contains: search } },
      { to: { contains: search } },
      { summary: { contains: search } },
    ];
  }

  // Fetch calls + total count in parallel
  const [calls, totalCount, stats] = await Promise.all([
    prisma.phoneCall.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        callSid: true,
        from: true,
        to: true,
        direction: true,
        status: true,
        duration: true,
        recordingUrl: true,
        transcription: true,
        sentiment: true,
        summary: true,
        leadId: true,
        createdAt: true,
      },
    }),
    prisma.phoneCall.count({ where }),
    getStats(clientId),
  ]);

  const jsonResponse = NextResponse.json({
    calls: calls.map((call) => ({
      id: call.id,
      callSid: call.callSid,
      from: call.from,
      to: call.to,
      direction: call.direction,
      status: call.status,
      duration: call.duration,
      recordingUrl: call.recordingUrl,
      transcription: call.transcription,
      sentiment: call.sentiment,
      summary: call.summary,
      leadId: call.leadId,
      createdAt: call.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    stats,
  });
  jsonResponse.headers.set("Cache-Control", "private, max-age=60");
  return jsonResponse;
}

// ---------------------------------------------------------------------------
// Stats helper
// ---------------------------------------------------------------------------

async function getStats(clientId: string) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const recentWhere = { clientId, createdAt: { gte: ninetyDaysAgo } };

  const [totalCalls, todayCalls, leadsCount, avgResult, sentimentGroups] =
    await Promise.all([
      prisma.phoneCall.count({ where: recentWhere }),
      prisma.phoneCall.count({
        where: {
          clientId,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.phoneCall.count({
        where: {
          clientId,
          createdAt: { gte: ninetyDaysAgo },
          leadId: { not: null },
        },
      }),
      prisma.phoneCall.aggregate({
        where: {
          ...recentWhere,
          duration: { gt: 0 },
        },
        _avg: { duration: true },
      }),
      prisma.phoneCall.groupBy({
        by: ["sentiment"],
        where: recentWhere,
        _count: { sentiment: true },
      }),
    ]);

  const avgDuration = Math.round(avgResult._avg.duration ?? 0);

  // Sentiment breakdown
  const sentimentBreakdown = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  for (const group of sentimentGroups) {
    if (
      group.sentiment === "positive" ||
      group.sentiment === "neutral" ||
      group.sentiment === "negative"
    ) {
      sentimentBreakdown[group.sentiment] = group._count.sentiment;
    }
  }

  // Top sentiment
  let topSentiment: "positive" | "neutral" | "negative" = "neutral";
  if (
    sentimentBreakdown.positive >= sentimentBreakdown.neutral &&
    sentimentBreakdown.positive >= sentimentBreakdown.negative
  ) {
    topSentiment = "positive";
  } else if (sentimentBreakdown.negative > sentimentBreakdown.neutral) {
    topSentiment = "negative";
  }

  return {
    totalCalls,
    callsToday: todayCalls,
    avgDuration,
    leadsCaptured: leadsCount,
    sentimentBreakdown,
    topSentiment,
  };
}
