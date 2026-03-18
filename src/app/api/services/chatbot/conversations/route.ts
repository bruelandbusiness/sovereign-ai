import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  // Find the chatbot config for this client
  const config = await prisma.chatbotConfig.findUnique({
    where: { clientId },
  });

  if (!config) {
    return NextResponse.json({ error: "Chatbot not provisioned" }, { status: 404 });
  }

  // Fetch conversations for this chatbot
  const conversations = await prisma.chatbotConversation.findMany({
    where: { chatbotId: config.id },
    orderBy: { createdAt: "desc" },
  });

  const result = conversations.map((conv) => {
    let messageCount = 0;
    try {
      const messages = JSON.parse(conv.messages) as ChatMessage[];
      messageCount = messages.length;
    } catch {
      messageCount = 0;
    }

    return {
      id: conv.id,
      visitorName: conv.visitorName,
      visitorEmail: conv.visitorEmail,
      leadCaptured: conv.leadCaptured,
      messageCount,
      createdAt: conv.createdAt.toISOString(),
    };
  });

  return NextResponse.json(result);
}
