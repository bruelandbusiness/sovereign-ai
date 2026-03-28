import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rate-limit";
import { MARKETING_SYSTEM_PROMPT } from "@/lib/marketing-chatbot-config";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { enrollInFollowUp } from "@/lib/followup";

// The follow-up nurture sequence to enroll marketing chat leads into.
const NURTURE_SEQUENCE_ID = "cmn7z5zas0007zaot9myuj75f";

// ---------------------------------------------------------------------------
// Public marketing chatbot chat endpoint.
//
// Uses the static MARKETING_SYSTEM_PROMPT — no database ChatbotConfig record
// required. Lead info (name, email) is accepted and included in the system
// prompt context so the AI can personalise its replies and the lead is
// identified for CRM purposes.
// ---------------------------------------------------------------------------

const chatSchema = z.object({
  message: z
    .string()
    .min(1, "message is required")
    .max(2000, "Message must be 2000 characters or fewer"),
  conversationId: z.string().optional(),
  /** Lead info collected before the chat started */
  leadName: z.string().max(100).optional(),
  leadEmail: z.string().email().optional(),
  /** Prior message history so we don't need a DB for a stateless widget */
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(40)
    .optional(),
});

export const dynamic = "force-dynamic";

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

    const { message, conversationId, leadName, leadEmail, history = [] } =
      parsed.data;

    // Rate-limit: 30 requests per IP/session per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rateLimitKey = `marketing-chat:${conversationId ?? ip}`;
    const { allowed } = await rateLimit(rateLimitKey, 30, 30 / 3600);

    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before sending more messages." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Build a system prompt that includes lead context if available
    const leadContext =
      leadName || leadEmail
        ? `\n\n## CURRENT VISITOR\nName: ${leadName ?? "unknown"}\nEmail: ${leadEmail ?? "not provided"}\nGreet them by name when it feels natural.`
        : "";

    const systemPrompt = MARKETING_SYSTEM_PROMPT + leadContext;

    // Build the messages array (history + new user message)
    const apiMessages: Array<{ role: "user" | "assistant"; content: string }> =
      [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ];

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      system: systemPrompt,
      messages: apiMessages,
    });

    const reply =
      response.content
        .filter((block) => block.type === "text")
        .map((block) => (block as { type: "text"; text: string }).text)
        .join("") || "I'm having trouble responding right now. Please try again!";

    // Enroll the lead in the nurture sequence the first time we receive their
    // email address.  We only do this once per email — check for an existing
    // FollowUpEntry before creating a new one.
    if (leadEmail) {
      try {
        const existingEntry = await prisma.followUpEntry.findFirst({
          where: {
            sequenceId: NURTURE_SEQUENCE_ID,
            contactEmail: leadEmail.toLowerCase(),
          },
          select: { id: true },
        });

        if (!existingEntry) {
          // Resolve the clientId that owns the nurture sequence.
          const sequence = await prisma.followUpSequence.findUnique({
            where: { id: NURTURE_SEQUENCE_ID },
            select: { clientId: true },
          });

          if (!sequence) {
            logger.warn(
              `[marketing/chat] Nurture sequence ${NURTURE_SEQUENCE_ID} not found — skipping enrollment`
            );
          } else {
            // Find or create a ProspectLead CRM record for this chat lead.
            let lead = await prisma.prospectLead.findFirst({
              where: { email: leadEmail.toLowerCase() },
              select: { id: true },
            });

            if (!lead) {
              lead = await prisma.prospectLead.create({
                data: {
                  name: leadName ?? leadEmail,
                  email: leadEmail.toLowerCase(),
                  source: "marketing_chat",
                },
                select: { id: true },
              });
            }

            // Create a Lead record so this contact appears in the dashboard.
            // Guard against duplicates by checking clientId + email first.
            const existingLead = await prisma.lead.findFirst({
              where: {
                clientId: sequence.clientId,
                email: leadEmail.toLowerCase(),
              },
              select: { id: true },
            });

            if (!existingLead) {
              await prisma.lead.create({
                data: {
                  clientId: sequence.clientId,
                  name: leadName ?? leadEmail,
                  email: leadEmail.toLowerCase(),
                  source: "marketing_chatbot",
                  status: "new",
                },
              });
            }

            await enrollInFollowUp({
              clientId: sequence.clientId,
              sequenceId: NURTURE_SEQUENCE_ID,
              leadId: lead.id,
              contactEmail: leadEmail.toLowerCase(),
              contactName: leadName ?? undefined,
            });

            logger.info("[marketing/chat] Lead enrolled in nurture sequence", {
              email: leadEmail,
              sequenceId: NURTURE_SEQUENCE_ID,
            });
          }
        }
      } catch (err) {
        // Enrollment is best-effort — never block the chat reply
        logger.errorWithCause(
          "[marketing/chat] Failed to enroll lead in nurture sequence:",
          err
        );
      }
    }

    return NextResponse.json(
      { reply, conversationId: conversationId ?? crypto.randomUUID() },
      { headers: corsHeaders }
    );
  } catch (error) {
    logger.errorWithCause("Marketing chat error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate response",
        reply:
          "Sorry, something went wrong. Please try again or book a free call at /strategy-call",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
