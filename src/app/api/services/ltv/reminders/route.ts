import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const reminderSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().max(254).optional(),
  customerPhone: z.string().max(30).optional(),
  serviceType: z.string().max(100).optional(),
  lastServiceDate: z.string().max(50).optional(),
  frequency: z.string().max(30).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const reminders = await prisma.serviceReminder.findMany({
    where: { clientId },
    orderBy: { nextDueDate: "asc" },
    take: 100,
  });

  return NextResponse.json(
    reminders.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
      serviceType: r.serviceType,
      lastServiceDate: r.lastServiceDate.toISOString(),
      nextDueDate: r.nextDueDate.toISOString(),
      frequency: r.frequency,
      status: r.status,
      sentAt: r.sentAt?.toISOString() || null,
      bookedAt: r.bookedAt?.toISOString() || null,
      revenue: r.revenue,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const parsed = reminderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      lastServiceDate,
      frequency,
    } = parsed.data;

    if (!serviceType || !lastServiceDate) {
      return NextResponse.json(
        { error: "serviceType and lastServiceDate are required" },
        { status: 400 }
      );
    }

    const clientId = session.account.client.id;
    const lastDate = new Date(lastServiceDate);
    const freq = frequency || "annual";

    // Calculate next due date based on frequency
    const nextDueDate = new Date(lastDate);
    switch (freq) {
      case "monthly":
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case "quarterly":
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        break;
      case "semi_annual":
        nextDueDate.setMonth(nextDueDate.getMonth() + 6);
        break;
      case "annual":
      default:
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
    }

    const reminder = await prisma.serviceReminder.create({
      data: {
        clientId,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        serviceType,
        lastServiceDate: lastDate,
        nextDueDate,
        frequency: freq,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        id: reminder.id,
        customerName: reminder.customerName,
        customerEmail: reminder.customerEmail,
        customerPhone: reminder.customerPhone,
        serviceType: reminder.serviceType,
        lastServiceDate: reminder.lastServiceDate.toISOString(),
        nextDueDate: reminder.nextDueDate.toISOString(),
        frequency: reminder.frequency,
        status: reminder.status,
        sentAt: null,
        bookedAt: null,
        revenue: null,
        createdAt: reminder.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create service reminder" },
      { status: 500 }
    );
  }
}
