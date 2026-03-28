import { prisma } from "@/lib/db";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import { extractTextContent, sanitizeForPrompt } from "@/lib/ai-utils";

import { logger } from "@/lib/logger";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface HandleChatMessageResult {
  reply: string;
  conversationId: string;
  leadCaptured: boolean;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision an AI chatbot for a client. Creates a ChatbotConfig with an
 * auto-generated system prompt based on the client's business info.
 */
export async function provisionChatbot(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const existing = await prisma.chatbotConfig.findUnique({
    where: { clientId },
  });

  if (existing) return existing;

  const systemPrompt = generateSystemPrompt(client);

  return prisma.chatbotConfig.create({
    data: {
      clientId,
      systemPrompt,
      greeting: `Hi there! Welcome to ${client.businessName}. How can we help you today?`,
      primaryColor: "#4c85ff",
      isActive: true,
    },
  });
}

// ---------------------------------------------------------------------------
// handleChatMessage — core conversational AI logic
// ---------------------------------------------------------------------------

/**
 * Handle an incoming chat message from a website visitor.
 *
 * 1. Loads (or creates) the chatbot config for the client
 * 2. Loads existing conversation history (if conversationId provided)
 * 3. Calls Claude via guardedAnthropicCall with the business-specific system prompt
 * 4. Persists the updated conversation to the database
 * 5. Detects lead capture signals in the conversation
 *
 * @param clientId        - The client whose chatbot should respond
 * @param visitorMessage  - The visitor's latest message
 * @param conversationId  - Optional existing conversation to continue
 * @returns The AI reply, conversation ID, and whether a lead was captured
 */
export async function handleChatMessage(
  clientId: string,
  visitorMessage: string,
  conversationId?: string
): Promise<HandleChatMessageResult> {
  // 1. Load chatbot config (provision if needed)
  let config = await prisma.chatbotConfig.findUnique({
    where: { clientId },
  });

  if (!config) {
    config = await provisionChatbot(clientId);
  }

  if (!config.isActive) {
    return {
      reply:
        "Our chat assistant is currently unavailable. Please call us directly for immediate help.",
      conversationId: conversationId || "",
      leadCaptured: false,
    };
  }

  // 2. Load existing conversation or start fresh
  let history: ChatMessage[] = [];
  let existingConversationId: string | null = null;

  if (conversationId) {
    const conversation = await prisma.chatbotConversation.findUnique({
      where: { id: conversationId },
    });

    if (conversation && conversation.chatbotId === config.id) {
      existingConversationId = conversation.id;
      try {
        history = JSON.parse(conversation.messages) as ChatMessage[];
      } catch {
        history = [];
      }
    }
  }

  // 3. Sanitize input and build the messages array
  const safeMessage = sanitizeForPrompt(visitorMessage, 2000);

  const apiMessages = [
    ...history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: safeMessage },
  ];

  // 4. Call Claude via governance guard
  let reply: string;
  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "chatbot.response",
      description: "Chatbot conversation response",
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: config.systemPrompt,
        messages: apiMessages,
      },
    });

    reply = extractTextContent(response, "");
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      return {
        reply:
          "I'm temporarily unable to respond. Please call us directly and we'll be happy to help!",
        conversationId: conversationId || "",
        leadCaptured: false,
      };
    }
    // For any other AI error, return a graceful fallback
    logger.errorWithCause("[chatbot] AI call failed:", error);
    return {
      reply:
        "I'm having a little trouble right now. Can I have someone from our team reach out to you? Just leave your name and phone number!",
      conversationId: conversationId || "",
      leadCaptured: false,
    };
  }

  if (!reply) {
    reply =
      "I apologize, but I couldn't generate a response. Please try again or call us directly.";
  }

  // 5. Persist the conversation
  const now = new Date().toISOString();
  const updatedHistory: ChatMessage[] = [
    ...history,
    { role: "user", content: safeMessage, timestamp: now },
    { role: "assistant", content: reply, timestamp: now },
  ];

  const messagesJson = JSON.stringify(updatedHistory);

  // Detect lead capture: check if the conversation contains contact info
  const fullText = updatedHistory.map((m) => m.content).join(" ");
  const leadCaptured = detectLeadSignals(fullText);

  let finalConversationId: string;

  if (existingConversationId) {
    await prisma.chatbotConversation.update({
      where: { id: existingConversationId },
      data: {
        messages: messagesJson,
        leadCaptured,
      },
    });
    finalConversationId = existingConversationId;
  } else {
    const newConversation = await prisma.chatbotConversation.create({
      data: {
        chatbotId: config.id,
        messages: messagesJson,
        leadCaptured,
      },
    });
    finalConversationId = newConversation.id;
  }

  // 6. If lead captured, create a Lead record and activity event
  if (leadCaptured) {
    const contactInfo = extractContactInfo(fullText);
    if (contactInfo.phone || contactInfo.email) {
      try {
        // Avoid duplicate leads by checking if one exists for this conversation
        const existingLead = await prisma.lead.findFirst({
          where: {
            clientId,
            source: "chatbot",
            notes: { contains: finalConversationId },
          },
        });

        if (!existingLead) {
          await prisma.lead.create({
            data: {
              clientId,
              name: contactInfo.name || "Website Visitor",
              email: contactInfo.email,
              phone: contactInfo.phone,
              source: "chatbot",
              status: "new",
              notes: `Captured via chatbot conversation ${finalConversationId}`,
            },
          });

          await prisma.activityEvent.create({
            data: {
              clientId,
              type: "lead_captured",
              title: "New lead from chatbot",
              description: `${contactInfo.name || "A visitor"} shared their contact info via the website chatbot.`,
            },
          });
        }
      } catch (err) {
        // Non-critical: log but don't fail the chat response
        logger.errorWithCause("[chatbot] Failed to create lead:", err);
      }
    }
  }

  return {
    reply,
    conversationId: finalConversationId,
    leadCaptured,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSystemPrompt(client: {
  businessName: string;
  ownerName: string;
  vertical: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  serviceAreaRadius: string | null;
}) {
  const location =
    client.city && client.state
      ? `${client.city}, ${client.state}`
      : "their local area";

  const serviceArea = client.serviceAreaRadius
    ? `within a ${client.serviceAreaRadius} mile radius`
    : "in the local area";

  const bookingLine = client.website
    ? `If they want to schedule, direct them to: ${client.website}/book`
    : "If they want to schedule, collect their preferred date/time and contact info.";

  return `You are a helpful and friendly AI assistant for ${client.businessName}, a ${client.vertical || "home service"} company located in ${location} serving customers ${serviceArea}.

Your role is to:
1. Answer questions about ${client.businessName}'s services, pricing, and availability
2. Help visitors schedule appointments or request quotes
3. Collect contact information (name, phone, email) from interested leads
4. Be warm, professional, and helpful at all times

Important guidelines:
- Always be enthusiastic about ${client.businessName}'s services
- If you don't know specific details (like exact pricing or schedule), say something like "Let me have someone get back to you with the exact details. Can I get your phone number?"
- Always try to capture the visitor's contact info naturally
- Keep responses concise — 2-3 sentences max
- If someone needs emergency service, tell them to call directly
- Never make up specific prices, schedules, or details you don't know
- Speak in a friendly, conversational tone — not overly formal
- ${bookingLine}

The owner is ${client.ownerName}. The business is known for quality ${client.vertical || "home service"} work in ${location}.`;
}

/**
 * Detect whether a conversation contains lead-qualifying signals
 * (phone numbers, email addresses, or explicit scheduling requests).
 */
function detectLeadSignals(text: string): boolean {
  // Phone number patterns (US-centric)
  const phonePattern =
    /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  return phonePattern.test(text) || emailPattern.test(text);
}

/**
 * Best-effort extraction of contact information from conversation text.
 */
function extractContactInfo(text: string): {
  name: string | undefined;
  phone: string | undefined;
  email: string | undefined;
} {
  const phoneMatch = text.match(
    /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/
  );
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );

  // Try to find a name — look for "my name is ..." or "I'm ..." patterns
  const nameMatch = text.match(
    /(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i
  );

  return {
    name: nameMatch?.[1],
    phone: phoneMatch?.[0],
    email: emailMatch?.[0],
  };
}
