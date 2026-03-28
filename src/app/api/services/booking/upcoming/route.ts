import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const createBookingSchema = z.object({
  customerName: z.string().min(1, "customerName is required").max(200),
  customerEmail: z.string().email().max(320).optional().nullable(),
  customerPhone: z.string().max(30).optional().nullable(),
  serviceType: z.string().max(100).optional().nullable(),
  startsAt: z.string().min(1, "startsAt is required").max(100),
  endsAt: z.string().min(1, "endsAt is required").max(100),
  notes: z.string().max(5000).optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const bookings = await prisma.booking.findMany({
    where: {
      clientId,
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: 50,
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      serviceType: true,
      startsAt: true,
      endsAt: true,
      status: true,
      notes: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      serviceType: b.serviceType,
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      status: b.status,
      notes: b.notes,
      createdAt: b.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createBookingSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parsed.data;

  const booking = await prisma.booking.create({
    data: {
      clientId,
      customerName: body.customerName,
      customerEmail: body.customerEmail || null,
      customerPhone: body.customerPhone || null,
      serviceType: body.serviceType || null,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      notes: body.notes || null,
      status: "confirmed",
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "call_booked",
      title: "New booking created",
      description: `Appointment booked for ${body.customerName} on ${new Date(body.startsAt).toLocaleDateString()}.`,
    },
  });

  return NextResponse.json(
    {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      serviceType: booking.serviceType,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
