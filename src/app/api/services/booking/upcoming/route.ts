import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  let body: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    serviceType?: string;
    startsAt?: string;
    endsAt?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.customerName || !body.startsAt || !body.endsAt) {
    return NextResponse.json(
      { error: "customerName, startsAt, and endsAt are required" },
      { status: 400 }
    );
  }

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
