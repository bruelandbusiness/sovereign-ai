import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.account.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { businessName: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(
    tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      businessName: t.client.businessName,
      messageCount: t._count.messages,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  );
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.account.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ticketId, status, message } = body as {
    ticketId?: string;
    status?: string;
    message?: string;
  };

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId required" }, { status: 400 });
  }

  if (status) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });
  }

  if (message) {
    await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderRole: "admin",
        message,
      },
    });
  }

  return NextResponse.json({ success: true });
}
