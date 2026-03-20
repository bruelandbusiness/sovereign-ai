import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";

const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  phone: z.string().max(30).optional(),
  isPrimary: z.boolean().optional(),
});

export async function GET() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const locations = await prisma.location.findMany({
    where: { clientId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    take: 100,
    include: {
      _count: { select: { leads: true, bookings: true } },
    },
  });

  return NextResponse.json(
    locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
      phone: loc.phone,
      isPrimary: loc.isPrimary,
      leadsCount: loc._count.leads,
      bookingsCount: loc._count.bookings,
      createdAt: loc.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const body = await request.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, address, city, state, zip, phone, isPrimary } = parsed.data;

    // If setting as primary, unset all existing primaries
    if (isPrimary) {
      await prisma.location.updateMany({
        where: { clientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // If this is the first location, make it primary
    const existingCount = await prisma.location.count({ where: { clientId } });
    const shouldBePrimary = isPrimary || existingCount === 0;

    const location = await prisma.location.create({
      data: {
        clientId,
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        phone: phone || null,
        isPrimary: shouldBePrimary,
      },
    });

    return NextResponse.json(
      {
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        phone: location.phone,
        isPrimary: location.isPrimary,
        leadsCount: 0,
        bookingsCount: 0,
        createdAt: location.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/dashboard/locations] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
