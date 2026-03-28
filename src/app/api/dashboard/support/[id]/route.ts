import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { z } from "zod";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const messageSchema = z.object({
  message: z.string().min(1).max(10000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { clientId } = await requireClient();

    const { id } = await params;

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, clientId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 200 },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: ticket.messages.map((m) => ({
        id: m.id,
        senderRole: m.senderRole,
        message: m.message,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[support/[id]] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { clientId } = await requireClient();

    const { id } = await params;

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, clientId },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { message } = parsed.data;

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderRole: "client",
        message,
      },
    });

    return NextResponse.json({
      id: msg.id,
      senderRole: msg.senderRole,
      message: msg.message,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[support/[id]] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}
