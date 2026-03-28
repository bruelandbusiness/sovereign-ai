import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
// ---------------------------------------------------------------------------
// Capacity Engine — adjusts marketing recommendations based on availability
// ---------------------------------------------------------------------------

interface BusinessHours {
  [key: string]: string; // e.g. "mon": "9:00-17:00"
}

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  mon: "9:00-17:00",
  tue: "9:00-17:00",
  wed: "9:00-17:00",
  thu: "9:00-17:00",
  fri: "9:00-17:00",
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DEFAULT_SLOT_DURATION = 60; // minutes

/**
 * Calculate the capacity score (0-100) for a client.
 * 0 = fully booked, 100 = wide open.
 */
export async function getCapacityScore(clientId: string): Promise<{
  score: number;
  openSlots: number;
  totalSlots: number;
  bookedSlots: number;
}> {
  // Get booking config
  let businessHours = DEFAULT_BUSINESS_HOURS;
  let slotDuration = DEFAULT_SLOT_DURATION;

  const clientService = await prisma.clientService.findFirst({
    where: { clientId, serviceId: "booking" },
  });

  if (clientService?.config) {
    try {
      const config = JSON.parse(clientService.config) as {
        businessHours?: BusinessHours;
        slotDuration?: number;
      };
      if (config.businessHours) businessHours = config.businessHours;
      if (config.slotDuration) slotDuration = config.slotDuration;
    } catch (err) {
      logger.warnWithCause("[capacity] Config parse error, using defaults", err);
    }
  }

  // Look at the next 14 days
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Get existing bookings
  const existingBookings = await prisma.booking.findMany({
    where: {
      clientId,
      startsAt: { gte: now },
      endsAt: { lte: twoWeeksLater },
      status: { not: "canceled" },
    },
  });

  // Calculate total available slots and booked slots
  let totalSlots = 0;
  let bookedSlots = 0;

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    const dayKey = DAY_KEYS[date.getDay()];
    const hoursStr = businessHours[dayKey];

    if (!hoursStr) continue; // No business hours this day

    const [startStr, endStr] = hoursStr.split("-");
    const [startHour, startMin] = startStr.split(":").map(Number);
    const [endHour, endMin] = endStr.split(":").map(Number);

    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMin, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMin, 0, 0);

    let slotStart = new Date(dayStart);

    while (slotStart.getTime() + slotDuration * 60 * 1000 <= dayEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

      // Skip past slots
      if (slotStart > now) {
        totalSlots++;

        // Check if booked
        const isBooked = existingBookings.some(
          (b) => slotStart < b.endsAt && slotEnd > b.startsAt
        );

        if (isBooked) {
          bookedSlots++;
        }
      }

      slotStart = new Date(slotEnd);
    }
  }

  const openSlots = totalSlots - bookedSlots;
  const score = totalSlots > 0 ? Math.round((openSlots / totalSlots) * 100) : 100;

  return { score, openSlots, totalSlots, bookedSlots };
}

export interface SpendRecommendation {
  level: "reduce" | "maintain" | "increase" | "maximize";
  message: string;
  percentChange: number;
}

/**
 * Get ad spend recommendation based on capacity score.
 */
export function getAdSpendRecommendation(score: number): SpendRecommendation {
  if (score <= 20) {
    return {
      level: "reduce",
      message: "Reduce ad spend by 50%, you're nearly full",
      percentChange: -50,
    };
  }
  if (score <= 50) {
    return {
      level: "maintain",
      message: "Maintain current spend",
      percentChange: 0,
    };
  }
  if (score <= 80) {
    return {
      level: "increase",
      message: "Increase ad spend by 25%",
      percentChange: 25,
    };
  }
  return {
    level: "maximize",
    message: "Maximize ad spend, many open slots",
    percentChange: 50,
  };
}
