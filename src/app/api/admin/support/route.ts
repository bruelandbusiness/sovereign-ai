import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const ticketUpdateSchema = z.object({
  ticketId: z.string().min(1, "ticketId is required"),
  status: z
    .enum(["open", "in_progress", "resolved", "closed"])
    .optional(),
  message: z.string().min(1).max(5000).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
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
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ticketUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { ticketId, status, message } = parsed.data;

  // Verify ticket exists before updating
  const existing = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Ticket not found" },
      { status: 404 }
    );
  }

  if (!status && !message) {
    return NextResponse.json(
      { error: "At least one of status or message is required" },
      { status: 400 }
    );
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

  await logAudit({
    accountId,
    action: "update",
    resource: "support_ticket",
    resourceId: ticketId,
    metadata: {
      ...(status ? { statusChange: { from: existing.status, to: status } } : {}),
      ...(message ? { adminReply: true } : {}),
    },
  });

  return NextResponse.json({ success: true });
}
