import { NextResponse } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getAnthropicProvider } from "@/lib/ai";
import {
  guardedAICheck,
  estimateCost,
  recordAISpend,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import { logger } from "@/lib/logger";

const chatSchema = z.object({
  chatbotId: z.string().min(1, "chatbotId is required"),
  message: z
    .string()
    .min(1, "message is required")
    .max(2000, "Message must be 2000 characters or fewer"),
  conversationId: z.string().optional(),
});

export const dynamic = "force-dynamic";

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
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400, headers: corsHeaders }
      );
    }
    const { chatbotId, message, conversationId } = parsed.data;

    // Rate limit: 30 messages per conversation per hour
    const rateLimitKey = `chat:${conversationId || chatbotId}`;
    const { allowed } = await rateLimit(rateLimitKey, 30, 30 / 3600);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before sending more messages.",
        },
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

    // Build the messages array for the AI SDK
    const apiMessages = [
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Governance pre-flight check (budget + approval)
    const maxTokens = 300;
    const estimatedCents = estimateCost(500, maxTokens);
    const guard = await guardedAICheck({
      clientId: config.clientId,
      action: "chatbot.response",
      estimatedCostCents: estimatedCents,
      description: "Chatbot conversation response",
    });

    if (!guard.allowed) {
      throw new GovernanceBlockedError(
        guard.reason || "Governance check failed",
        guard.approvalRequestId
      );
    }

    // Get the Anthropic provider (throws if API key is missing)
    const anthropic = getAnthropicProvider();

    // Stream the response using the Vercel AI SDK
    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: config.systemPrompt,
      messages: apiMessages,
      maxOutputTokens: maxTokens,
      async onFinish({ text, usage }) {
        // Record actual spend via governance
        const actualCost = estimateCost(
          usage.inputTokens ?? 0,
          usage.outputTokens ?? 0
        );
        const spendResult = await recordAISpend(config.clientId, actualCost);
        if (!spendResult.success) {
          logger.warn(
            `[ai-guard] Budget overage for client ${config.clientId}`,
            { reason: spendResult.reason }
          );
        }

        // Persist conversation history
        const now = new Date().toISOString();
        const updatedHistory: ChatMessage[] = [
          ...history,
          { role: "user", content: message, timestamp: now },
          { role: "assistant", content: text, timestamp: now },
        ];
        const messagesJson = JSON.stringify(updatedHistory);

        try {
          if (existingConversation) {
            await prisma.chatbotConversation.update({
              where: { id: existingConversation.id },
              data: { messages: messagesJson },
            });
          } else {
            await prisma.chatbotConversation.create({
              data: { chatbotId, messages: messagesJson },
            });
          }
        } catch (dbError) {
          logger.errorWithCause(
            "Failed to persist chatbot conversation",
            dbError
          );
        }
      },
    });

    return result.toTextStreamResponse({ headers: corsHeaders });
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      return NextResponse.json(
        { error: "AI usage limit reached. Please try again later." },
        { status: 429, headers: corsHeaders }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("ANTHROPIC_API_KEY is not configured")
    ) {
      return NextResponse.json(
        { error: "AI service is not configured. Please contact support." },
        { status: 503, headers: corsHeaders }
      );
    }

    logger.errorWithCause("Chatbot chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500, headers: corsHeaders }
    );
  }
}
