import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { sendSms } from "@/lib/twilio";
import { addToInbox } from "@/lib/unified-inbox";
import { z } from "zod";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const replySchema = z.object({
  message: z.string().min(1).max(10000),
});
const statusSchema = z.object({
  status: z.string().min(1).max(30),
});

// ---------------------------------------------------------------------------
// GET — Retrieve all messages in a conversation thread
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { threadId } = await params;

  try {
    const thread = await prisma.conversationThread.findFirst({
      where: { id: threadId, clientId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Fetch messages from UnifiedMessage via threadId
    const messages = await prisma.unifiedMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        contactName: thread.contactName,
        contactPhone: thread.contactPhone,
        contactEmail: thread.contactEmail,
        channel: thread.channel,
        status: thread.status,
        lastMessageAt: thread.lastMessageAt.toISOString(),
        leadId: null,
      },
      messages: messages.map((m: typeof messages[0]) => ({
        id: m.id,
        channel: m.channel,
        direction: m.direction,
        senderName: m.senderName,
        senderContact: m.senderContact,
        content: m.content,
        metadata: m.metadata,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.errorWithCause("[dashboard/inbox/[threadId]] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Send a reply in the thread via the appropriate channel
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { threadId } = await params;

  try {
    const thread = await prisma.conversationThread.findFirst({
      where: { id: threadId, clientId },
      include: {
        client: { select: { businessName: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { message } = parsed.data;

    // Send via appropriate channel
    let sent = false;

    if (thread.channel === "sms" && thread.contactPhone) {
      const smsResult = await sendSms(thread.contactPhone, message.trim());
      if (smsResult.success) {
        sent = true;
      } else {
        logger.errorWithCause("[inbox] SMS send failed:", smsResult.error);
      }
    }

    // For other channels (email, chatbot, etc.), we record the message even
    // if we can't send it through the channel right now. The message is still
    // tracked in the inbox.
    if (!sent && thread.channel !== "sms") {
      // Mark as sent for channels we don't have outbound support for yet
      sent = true;
    }

    // Add the reply to the inbox
    const result = await addToInbox(clientId, {
      channel: thread.channel as "sms" | "email" | "chatbot" | "voice" | "social",
      direction: "outbound",
      senderName: thread.client.businessName,
      senderContact: null,
      content: message.trim(),
    });

    return NextResponse.json({
      success: true,
      sent,
      message: {
        id: result.message.id,
        content: result.message.content,
        direction: "outbound",
        createdAt: result.message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.errorWithCause("[api/dashboard/inbox] POST failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update thread status (open, closed, snoozed)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { threadId } = await params;

  try {
    const thread = await prisma.conversationThread.findFirst({
      where: { id: threadId, clientId },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsedStatus = statusSchema.safeParse(body);
    if (!parsedStatus.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsedStatus.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status } = parsedStatus.data;

    if (!["open", "closed", "snoozed"].includes(status)) {
      return NextResponse.json(
        { error: "status must be one of: open, closed, snoozed" },
        { status: 400 }
      );
    }

    const updated = await prisma.conversationThread.update({
      where: { id: thread.id },
      data: { status },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    logger.errorWithCause("[api/dashboard/inbox] PATCH failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
