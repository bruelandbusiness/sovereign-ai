import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { twilioPhoneNumber, validateTwilioSignature } from "@/lib/twilio";
import { addToInbox } from "@/lib/unified-inbox";
import { checkFreeTierLimit } from "@/lib/tier-limits";
import { extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST — Twilio Incoming SMS Webhook
//
// When a known lead texts back, continue the chatbot conversation via SMS.
// Looks up the lead by phone number, finds their chatbot conversation,
// generates an AI response using the same Claude context, and replies via SMS.
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate Twilio webhook signature
    const signature = request.headers.get("x-twilio-signature") || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/services/chatbot/sms`;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });
    if (!validateTwilioSignature(webhookUrl, params, signature)) {
      return new Response("Forbidden", { status: 403 });
    }

    const from = formData.get("From") as string | null;
    const body = formData.get("Body") as string | null;

    if (!from || !body) {
      return twimlResponse("Missing phone number or message body.");
    }

    const incomingMessage = body.trim();
    if (!incomingMessage) {
      return twimlResponse("");
    }

    if (incomingMessage.length > 2000) {
      return twimlResponse("Message too long. Please keep your message under 2000 characters.");
    }

    // Find a conversation for this phone number by looking up visitor info
    const conversation = await prisma.chatbotConversation.findFirst({
      where: {
        visitorEmail: from, // SMS phone stored in visitorEmail field as fallback
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      // No known conversation for this number — send a generic response
      return twimlResponse(
        "Thanks for your message! We'll have someone get back to you shortly."
      );
    }

    const config = await prisma.chatbotConfig.findUnique({
      where: { id: conversation.chatbotId },
      include: {
        client: {
          select: {
            id: true,
            businessName: true,
            accountId: true,
          },
        },
      },
    });

    if (!config) {
      return twimlResponse(
        "Thanks for your message! We'll have someone get back to you shortly."
      );
    }
    const clientId = config.client.id;

    // Enforce free tier conversation limit
    const tierCheck = await checkFreeTierLimit(clientId, "chatbot");
    if (!tierCheck.allowed) {
      return twimlResponse(
        "You've reached the free tier limit. Please ask the business to upgrade for continued SMS support."
      );
    }

    // Parse existing messages
    let history: ChatMessage[] = [];
    try {
      history = JSON.parse(conversation.messages) as ChatMessage[];
    } catch {
      history = [];
    }

    // Build the messages array for Claude (limit to last 20 messages)
    const recentHistory = history.slice(-20);
    const apiMessages = [
      ...recentHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: incomingMessage },
    ];

    // Enhance system prompt with SMS context
    const smsSystemPrompt = `${config.systemPrompt}

IMPORTANT: This conversation is continuing via SMS text message. Keep responses very short (1-2 sentences max, under 160 characters when possible). Be concise and direct. The customer originally started chatting on the website and opted to continue via text.`;

    // Call Claude API with governance budget/approval check
    let reply: string;
    try {
      const response = await guardedAnthropicCall({
        clientId,
        action: "chatbot.sms",
        description: "SMS chatbot response",
        params: {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: smsSystemPrompt,
          messages: apiMessages,
        },
      });
      reply = extractTextContent(response, "Sorry, I couldn't generate a response. Please try again.");
    } catch (err) {
      if (err instanceof GovernanceBlockedError) {
        return twimlResponse(
          "Our AI assistant is currently unavailable. A team member will follow up shortly."
        );
      }
      throw err;
    }

    // Update conversation history
    const now = new Date().toISOString();
    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: "user", content: incomingMessage, timestamp: now },
      { role: "assistant", content: reply, timestamp: now },
    ];

    await prisma.chatbotConversation.update({
      where: { id: conversation.id },
      data: {
        messages: JSON.stringify(updatedHistory),
      },
    });

    // Add to unified inbox
    try {
      await addToInbox(clientId, {
        channel: "sms",
        direction: "inbound",
        senderName: conversation.visitorName || null,
        senderContact: from,
        content: incomingMessage,
        metadata: JSON.stringify({ conversationId: conversation.id, viaSMS: true }),
      });

      await addToInbox(clientId, {
        channel: "sms",
        direction: "outbound",
        senderName: "AI Chatbot",
        senderContact: twilioPhoneNumber,
        content: reply,
        metadata: JSON.stringify({ conversationId: conversation.id, viaSMS: true }),
      });
    } catch (inboxErr) {
      logger.errorWithCause("[chatbot/sms] Failed to add to inbox:", inboxErr);
    }

    // Reply via TwiML
    return twimlResponse(reply);
  } catch (error) {
    logger.errorWithCause("[chatbot/sms] Error:", error);
    return twimlResponse(
      "Sorry, something went wrong. Please try again later."
    );
  }
}

// ---------------------------------------------------------------------------
// TwiML response helper
// ---------------------------------------------------------------------------

function twimlResponse(message: string): Response {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${message ? `<Message>${escapeXml(message)}</Message>` : ""}
</Response>`;

  return new Response(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
