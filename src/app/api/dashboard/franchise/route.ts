import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
  zip: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  manager: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// GET — Franchise Intelligence dashboard: locations + KPIs
// ---------------------------------------------------------------------------

export async function GET() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const locations = await prisma.franchiseLocation.findMany({
    where: { clientId },
    orderBy: { revenueThisMonth: "desc" },
    take: 100,
  });

  // Compute KPIs
  const totalLocations = locations.length;
  const combinedRevenue = locations.reduce(
    (sum, l) => sum + l.revenueThisMonth,
    0
  );
  const totalLeads = locations.reduce(
    (sum, l) => sum + l.leadsThisMonth,
    0
  );
  const activeLocations = locations.filter((l) => l.isActive);
  const avgRating =
    activeLocations.length > 0
      ? activeLocations.reduce((sum, l) => sum + l.avgRating, 0) /
        activeLocations.length
      : 0;

  const response = NextResponse.json({
    kpis: {
      totalLocations,
      combinedRevenue,
      totalLeads,
      avgRating: Math.round(avgRating * 10) / 10,
    },
    locations: locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
      phone: loc.phone,
      manager: loc.manager,
      isActive: loc.isActive,
      leadsThisMonth: loc.leadsThisMonth,
      revenueThisMonth: loc.revenueThisMonth,
      bookingsThisMonth: loc.bookingsThisMonth,
      avgRating: loc.avgRating,
      createdAt: loc.createdAt.toISOString(),
    })),
  });
  response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=10");
  return response;
}

// ---------------------------------------------------------------------------
// POST — Create a new franchise location
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createLocationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, city, state, address, zip, phone, manager } = parsed.data;

  try {
    const location = await prisma.franchiseLocation.create({
      data: {
        clientId,
        name,
        city: city || "",
        state: state || "",
        address: address || null,
        zip: zip || null,
        phone: phone || null,
        manager: manager || null,
      },
    });

    // Create an activity event
    try {
      await prisma.activityEvent.create({
        data: {
          clientId,
          type: "franchise_location_added",
          title: `Franchise location added: ${name}`,
          description: `New location "${name}" in ${city || "N/A"}, ${state || "N/A"} was added.`,
        },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip,
      phone: location.phone,
      manager: location.manager,
      isActive: location.isActive,
      leadsThisMonth: location.leadsThisMonth,
      revenueThisMonth: location.revenueThisMonth,
      bookingsThisMonth: location.bookingsThisMonth,
      avgRating: location.avgRating,
      createdAt: location.createdAt.toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[dashboard/franchise] POST failed", error);
    return NextResponse.json(
      { error: "Failed to create franchise location" },
      { status: 500 }
    );
  }
}
