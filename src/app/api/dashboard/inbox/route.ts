import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";

// ---------------------------------------------------------------------------
// GET — List conversation threads for the unified inbox (paginated, filterable)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const channel = searchParams.get("channel"); // null = all
  const status = searchParams.get("status") || "open"; // "open", "closed", "snoozed", "all"

  const where: Record<string, unknown> = { clientId };

  if (channel && channel !== "all") {
    where.channel = channel;
  }

  if (status !== "all") {
    where.status = status;
  }

  const [threads, totalCount] = await Promise.all([
    prisma.conversationThread.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversationThread.count({ where }),
  ]);

  // Fetch the latest message per thread from UnifiedMessage
  const threadIds = threads.map((t) => t.id);
  const latestMessages = threadIds.length > 0
    ? await prisma.unifiedMessage.findMany({
        where: { threadId: { in: threadIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const latestMessageMap = new Map<string, typeof latestMessages[0]>();
  for (const msg of latestMessages) {
    if (msg.threadId && !latestMessageMap.has(msg.threadId)) {
      latestMessageMap.set(msg.threadId, msg);
    }
  }

  const response = NextResponse.json({
    threads: threads.map((t) => {
      const lastMsg = latestMessageMap.get(t.id);
      return {
        id: t.id,
        contactName: t.contactName,
        contactPhone: t.contactPhone,
        contactEmail: t.contactEmail,
        channel: t.channel,
        status: t.status,
        lastMessageAt: t.lastMessageAt.toISOString(),
        leadId: null,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content.slice(0, 120),
              channel: lastMsg.channel,
              direction: lastMsg.direction,
              createdAt: lastMsg.createdAt.toISOString(),
            }
          : null,
        createdAt: t.createdAt.toISOString(),
      };
    }),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });

  response.headers.set("Cache-Control", "private, no-cache");

  return response;
}
