import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { extractTextContent } from "@/lib/ai-utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatbotId, message, conversationId } = body as {
      chatbotId?: string;
      message?: string;
      conversationId?: string;
    };

    if (!chatbotId || typeof chatbotId !== "string") {
      return NextResponse.json(
        { error: "chatbotId is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limit: 30 messages per conversation per hour
    const rateLimitKey = `chat:${conversationId || chatbotId}`;
    const { allowed } = rateLimit(rateLimitKey, 30, 30 / 3600);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before sending more messages." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Look up the chatbot config
    const config = await prisma.chatbotConfig.findUnique({
      where: { id: chatbotId },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!config.isActive) {
      return NextResponse.json(
        { error: "Chatbot is currently inactive" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Load existing conversation history or start fresh
    let history: ChatMessage[] = [];
    let existingConversation: { id: string } | null = null;

    if (conversationId) {
      const conversation = await prisma.chatbotConversation.findUnique({
        where: { id: conversationId },
      });

      if (conversation && conversation.chatbotId === chatbotId) {
        existingConversation = conversation;
        try {
          history = JSON.parse(conversation.messages) as ChatMessage[];
        } catch {
          history = [];
        }
      }
    }

    // Build the messages array for the Anthropic API
    const apiMessages = [
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Call Claude API via governance guard
    const response = await guardedAnthropicCall({
      clientId: config.clientId,
      action: "chatbot.response",
      description: "Chatbot conversation response",
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: config.systemPrompt,
        messages: apiMessages,
      },
    });

    const reply = extractTextContent(response, "");

    // Update the conversation history
    const now = new Date().toISOString();
    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: "user", content: message, timestamp: now },
      { role: "assistant", content: reply, timestamp: now },
    ];

    const messagesJson = JSON.stringify(updatedHistory);

    let finalConversationId: string;

    if (existingConversation) {
      // Update existing conversation
      await prisma.chatbotConversation.update({
        where: { id: existingConversation.id },
        data: { messages: messagesJson },
      });
      finalConversationId = existingConversation.id;
    } else {
      // Create new conversation
      const newConversation = await prisma.chatbotConversation.create({
        data: {
          chatbotId,
          messages: messagesJson,
        },
      });
      finalConversationId = newConversation.id;
    }

    return NextResponse.json(
      { reply, conversationId: finalConversationId },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      return NextResponse.json(
        { error: "AI usage limit reached. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }
    console.error("Chatbot chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500, headers: corsHeaders }
    );
  }
}
