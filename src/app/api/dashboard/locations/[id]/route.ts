import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";

const updateLocationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  const location = await prisma.location.findFirst({
    where: { id, clientId },
    include: {
      _count: { select: { leads: true, bookings: true } },
    },
  });

  if (!location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    zip: location.zip,
    phone: location.phone,
    isPrimary: location.isPrimary,
    leadsCount: location._count.leads,
    bookingsCount: location._count.bookings,
    createdAt: location.createdAt.toISOString(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.location.findFirst({ where: { id, clientId } });
    if (!existing) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const d = parsed.data;

    // If setting as primary, unset all others
    if (d.isPrimary) {
      await prisma.location.updateMany({
        where: { clientId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    const data: Record<string, unknown> = {};
    if (d.name !== undefined) data.name = d.name;
    if (d.address !== undefined) data.address = d.address;
    if (d.city !== undefined) data.city = d.city;
    if (d.state !== undefined) data.state = d.state;
    if (d.zip !== undefined) data.zip = d.zip;
    if (d.phone !== undefined) data.phone = d.phone;
    if (d.isPrimary !== undefined) data.isPrimary = d.isPrimary;

    const location = await prisma.location.update({ where: { id }, data });

    return NextResponse.json({
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip,
      phone: location.phone,
      isPrimary: location.isPrimary,
    });
  } catch (error) {
    console.error("[api/dashboard/locations/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  const existing = await prisma.location.findFirst({ where: { id, clientId } });
  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  await prisma.location.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
