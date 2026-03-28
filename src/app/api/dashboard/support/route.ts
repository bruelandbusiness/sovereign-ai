import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { z } from "zod";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const createTicketSchema = z.object({
  subject: z.string().min(1).max(500),
  description: z.string().min(1).max(10000),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const tickets = await prisma.supportTicket.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        subject: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
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
        messageCount: t._count.messages,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[support] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { subject, description, priority } = parsed.data;

    const ticket = await prisma.supportTicket.create({
      data: {
        clientId,
        subject,
        description,
        priority: priority || "medium",
      },
    });

    return NextResponse.json({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[support] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
