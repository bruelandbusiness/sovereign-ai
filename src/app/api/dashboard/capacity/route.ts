import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { getCapacityScore, getAdSpendRecommendation } from "@/lib/capacity-marketing";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — capacity data: score, open slots, recommendation, utilization
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { clientId } = await requireClient();

    // Get upcoming bookings for the next 7 days for the chart
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Run capacity score and bookings query in parallel
    const [capacity, upcomingBookings] = await Promise.all([
      getCapacityScore(clientId),
      prisma.booking.findMany({
      where: {
        clientId,
        startsAt: { gte: now, lte: sevenDaysLater },
        status: { not: "canceled" },
      },
      orderBy: { startsAt: "asc" },
      take: 500,
      select: {
        id: true,
        customerName: true,
        serviceType: true,
        startsAt: true,
        endsAt: true,
        status: true,
      },
    }),
    ]);

    const recommendation = getAdSpendRecommendation(capacity.score);

    // Build daily utilization chart data
    const dailyUtilization: { date: string; booked: number; available: number }[] = [];
    const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const DEFAULT_HOURS: Record<string, string> = {
      mon: "9:00-17:00",
      tue: "9:00-17:00",
      wed: "9:00-17:00",
      thu: "9:00-17:00",
      fri: "9:00-17:00",
    };

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dayKey = DAY_KEYS[date.getDay()];
      const hoursStr = DEFAULT_HOURS[dayKey];

      if (!hoursStr) {
        dailyUtilization.push({
          date: date.toISOString().split("T")[0],
          booked: 0,
          available: 0,
        });
        continue;
      }

      const [startStr, endStr] = hoursStr.split("-");
      const [startHour, startMin] = startStr.split(":").map(Number);
      const [endHour, endMin] = endStr.split(":").map(Number);

      const dayStart = new Date(date);
      dayStart.setHours(startHour, startMin, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(endHour, endMin, 0, 0);

      const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60);
      const totalSlots = Math.floor(totalMinutes / 60);

      const dayBookings = upcomingBookings.filter((b) => {
        const bDate = new Date(b.startsAt);
        bDate.setHours(0, 0, 0, 0);
        return bDate.getTime() === date.getTime();
      });

      dailyUtilization.push({
        date: date.toISOString().split("T")[0],
        booked: dayBookings.length,
        available: Math.max(0, totalSlots - dayBookings.length),
      });
    }

    const response = NextResponse.json({
      score: capacity.score,
      openSlots: capacity.openSlots,
      totalSlots: capacity.totalSlots,
      bookedSlots: capacity.bookedSlots,
      recommendation,
      upcomingBookings: upcomingBookings.map((b) => ({
        id: b.id,
        customerName: b.customerName,
        serviceType: b.serviceType,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt.toISOString(),
        status: b.status,
      })),
      dailyUtilization,
    });
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=10");
    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[capacity] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch capacity data" },
      { status: 500 }
    );
  }
}
