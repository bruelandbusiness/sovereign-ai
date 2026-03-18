import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { rateLimitByIP } from "@/lib/rate-limit";

const bookingSchema = z.object({
  clientId: z.string().min(1),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(30).optional(),
  serviceType: z.string().max(200).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function POST(request: Request) {
  // Rate limit: 10 bookings per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimitByIP(ip, "booking", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many booking requests. Please try again later." },
      { status: 429 }
    );
  }

  const validation = await validateBody(request, bookingSchema);
  if (!validation.success) {
    return validation.response;
  }
  const body = validation.data;

  // Verify the client exists
  const client = await prisma.client.findUnique({
    where: { id: body.clientId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);

  // Check for overlapping bookings
  const overlapping = await prisma.booking.findFirst({
    where: {
      clientId: body.clientId,
      status: { not: "canceled" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });

  if (overlapping) {
    return NextResponse.json(
      { error: "Time slot is no longer available" },
      { status: 409 }
    );
  }

  // Create the booking record
  const booking = await prisma.booking.create({
    data: {
      clientId: body.clientId,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone || null,
      serviceType: body.serviceType || null,
      startsAt,
      endsAt,
      status: "confirmed",
    },
  });

  // Create a lead record from this booking
  await prisma.lead.create({
    data: {
      clientId: body.clientId,
      name: body.customerName,
      email: body.customerEmail,
      phone: body.customerPhone || null,
      source: "booking",
      status: "appointment",
      notes: body.serviceType
        ? `Booked ${body.serviceType} on ${startsAt.toLocaleDateString()}`
        : `Booking on ${startsAt.toLocaleDateString()}`,
    },
  });

  // Create an activity event
  await prisma.activityEvent.create({
    data: {
      clientId: body.clientId,
      type: "call_booked",
      title: "New booking received",
      description: `${body.customerName} booked ${body.serviceType || "an appointment"} for ${startsAt.toLocaleDateString()} at ${startsAt.toLocaleTimeString()}.`,
    },
  });

  return NextResponse.json(
    {
      id: booking.id,
      clientId: booking.clientId,
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
