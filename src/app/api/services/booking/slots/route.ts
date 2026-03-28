import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// --- CORS helpers (mirrors booking/book pattern) ---

function getAllowedOrigins(clientWebsite: string | null): string[] {
  const origins: string[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  origins.push(appUrl);

  if (clientWebsite) {
    try {
      const url = clientWebsite.startsWith("http")
        ? clientWebsite
        : `https://${clientWebsite}`;
      const parsed = new URL(url);
      origins.push(parsed.origin);
      if (parsed.hostname.startsWith("www.")) {
        origins.push(`${parsed.protocol}//${parsed.hostname.slice(4)}`);
      } else {
        origins.push(`${parsed.protocol}//www.${parsed.hostname}`);
      }
    } catch {
      // Ignore malformed URL
    }
  }

  return origins;
}

function buildCorsHeaders(
  requestOrigin: string | null,
  allowedOrigins: string[]
): Record<string, string> {
  const origin =
    requestOrigin && allowedOrigins.some((o) => o === requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || "";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function fallbackCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return buildCorsHeaders(requestOrigin, [appUrl, requestOrigin || ""]);
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: fallbackCorsHeaders(origin) });
}

interface BusinessHours {
  [key: string]: string; // e.g. "mon": "9:00-17:00"
}

interface BookingConfig {
  businessHours?: BusinessHours;
  slotDuration?: number; // minutes
}

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  mon: "9:00-17:00",
  tue: "9:00-17:00",
  wed: "9:00-17:00",
  thu: "9:00-17:00",
  fri: "9:00-17:00",
};

const DEFAULT_SLOT_DURATION = 60; // minutes

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export async function GET(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");

  // Rate limit: 60 requests per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "booking-slots", 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: fallbackCorsHeaders(requestOrigin) },
    );
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId query parameter is required" },
      { status: 400, headers: fallbackCorsHeaders(requestOrigin) }
    );
  }

  try {
  // Look up client for CORS
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { website: true },
  });

  const allowedOrigins = getAllowedOrigins(client?.website ?? null);
  const corsHeaders = buildCorsHeaders(requestOrigin, allowedOrigins);

  if (!client) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404, headers: corsHeaders },
    );
  }

  // Read business hours from ClientService config
  let businessHours = DEFAULT_BUSINESS_HOURS;
  let slotDuration = DEFAULT_SLOT_DURATION;

  const clientService = await prisma.clientService.findFirst({
    where: { clientId, serviceId: "booking" },
  });

  if (clientService?.config) {
    try {
      const config: BookingConfig = JSON.parse(clientService.config);
      if (config.businessHours) {
        businessHours = config.businessHours;
      }
      if (config.slotDuration) {
        slotDuration = config.slotDuration;
      }
    } catch {
      // Use defaults if config parsing fails
    }
  }

  // Get existing bookings for the next 7 days
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const existingBookings = await prisma.booking.findMany({
    where: {
      clientId,
      startsAt: { gte: now },
      endsAt: { lte: sevenDaysLater },
      status: { not: "canceled" },
    },
  });

  // Generate available slots for the next 7 days
  const result: { date: string; slots: { start: string; end: string }[] }[] =
    [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    const dayKey = DAY_KEYS[date.getDay()];
    const hoursStr = businessHours[dayKey];

    if (!hoursStr) {
      // No business hours for this day (e.g., weekends)
      result.push({ date: date.toISOString().split("T")[0], slots: [] });
      continue;
    }

    const [startStr, endStr] = hoursStr.split("-");
    const [startHour, startMin] = startStr.split(":").map(Number);
    const [endHour, endMin] = endStr.split(":").map(Number);

    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMin, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMin, 0, 0);

    const slots: { start: string; end: string }[] = [];
    let slotStart = new Date(dayStart);

    while (slotStart.getTime() + slotDuration * 60 * 1000 <= dayEnd.getTime()) {
      const slotEnd = new Date(
        slotStart.getTime() + slotDuration * 60 * 1000
      );

      // Skip slots in the past
      if (slotStart <= now) {
        slotStart = new Date(slotEnd);
        continue;
      }

      // Check if this slot overlaps with any existing booking
      const isBooked = existingBookings.some((booking) => {
        return slotStart < booking.endsAt && slotEnd > booking.startsAt;
      });

      if (!isBooked) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      slotStart = new Date(slotEnd);
    }

    result.push({
      date: date.toISOString().split("T")[0],
      slots,
    });
  }

  const response = NextResponse.json(result, { headers: corsHeaders });
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=30"
  );
  return response;
  } catch (error) {
    logger.errorWithCause("[booking/slots] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
