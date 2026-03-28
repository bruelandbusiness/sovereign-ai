import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — Dashboard KPIs for the AI Receptionist
//
// Returns:
//   callsToday, totalCalls, avgDuration, jobsBooked, emergencyCalls,
//   leadsCreated, sentimentBreakdown
// ---------------------------------------------------------------------------

export async function GET() {
  try {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const [
    allCalls,
    callsTodayCount,
    emergencyCount,
    jobsBookedCount,
    leadsCreatedCount,
  ] = await Promise.all([
    prisma.callLog.findMany({
      where: { clientId },
      select: {
        duration: true,
        sentiment: true,
      },
      take: 5000,
    }),
    prisma.callLog.count({
      where: {
        clientId,
        createdAt: { gte: todayStart },
      },
    }),
    prisma.callLog.count({
      where: {
        clientId,
        isEmergency: true,
      },
    }),
    prisma.callLog.count({
      where: {
        clientId,
        bookingCreated: true,
      },
    }),
    prisma.callLog.count({
      where: {
        clientId,
        leadCreated: true,
      },
    }),
  ]);

  // Average call duration (only completed calls with duration > 0)
  const withDuration = allCalls.filter((c) => c.duration > 0);
  const avgDuration =
    withDuration.length > 0
      ? Math.round(
          withDuration.reduce((sum, c) => sum + c.duration, 0) /
            withDuration.length
        )
      : 0;

  // Sentiment breakdown
  const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
  for (const call of allCalls) {
    if (
      call.sentiment === "positive" ||
      call.sentiment === "neutral" ||
      call.sentiment === "negative"
    ) {
      sentimentBreakdown[call.sentiment]++;
    }
  }

  return NextResponse.json({
    callsToday: callsTodayCount,
    totalCalls: allCalls.length,
    avgDuration,
    jobsBooked: jobsBookedCount,
    emergencyCalls: emergencyCount,
    leadsCreated: leadsCreatedCount,
    sentimentBreakdown,
  });
  } catch (error) {
    logger.error("GET /api/services/receptionist/stats failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
