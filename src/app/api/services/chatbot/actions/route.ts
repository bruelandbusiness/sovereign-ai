import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const actionSchema = z.object({
  chatbotId: z.string().min(1).max(100),
  conversationId: z.string().min(1).max(100),
  action: z.string().min(1).max(50),
  data: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// POST — AI Employee takes action (book appointment, send quote, follow up)
//
// Called by the chatbot when it detects an intent to perform a real action.
// ---------------------------------------------------------------------------

interface ActionPayload {
  chatbotId: string;
  conversationId: string;
  action: "book_appointment" | "send_quote" | "follow_up";
  data?: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    serviceType?: string;
    preferredDate?: string;
    preferredTime?: string;
    estimateRange?: string;
    notes?: string;
  };
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { chatbotId, conversationId, action, data } = parsed.data as ActionPayload;

    // Verify the chatbot exists
    const config = await prisma.chatbotConfig.findUnique({
      where: { id: chatbotId },
      include: {
        client: {
          select: {
            id: true,
            businessName: true,
            accountId: true,
            ownerName: true,
          },
        },
      },
    });

    if (!config) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Verify the authenticated user owns this chatbot (prevent IDOR)
    if (config.client.accountId !== session.account.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clientId = config.client.id;
    const accountId = config.client.accountId;

    switch (action) {
      // -------------------------------------------------------------------
      // Book Appointment
      // -------------------------------------------------------------------
      case "book_appointment": {
        if (!data?.customerName || !data?.customerPhone) {
          return NextResponse.json(
            { error: "customerName and customerPhone are required for booking" },
            { status: 400 }
          );
        }

        // Parse the preferred date/time or default to tomorrow at 10 AM
        let startsAt: Date;
        if (data.preferredDate) {
          startsAt = new Date(data.preferredDate);
          if (isNaN(startsAt.getTime())) {
            // Default to tomorrow at 10 AM
            startsAt = new Date();
            startsAt.setDate(startsAt.getDate() + 1);
            startsAt.setHours(10, 0, 0, 0);
          }
        } else {
          startsAt = new Date();
          startsAt.setDate(startsAt.getDate() + 1);
          startsAt.setHours(10, 0, 0, 0);
        }

        const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000); // 1 hour

        // Capture validated values before the transaction closure so TS
        // can narrow the types (the guard above ensures these are defined).
        const customerName = data.customerName;
        const customerPhone = data.customerPhone;

        // Wrap booking + notification + activity in a transaction for atomicity
        const booking = await prisma.$transaction(async (tx) => {
          const b = await tx.booking.create({
            data: {
              clientId,
              customerName,
              customerEmail: data.customerEmail ?? null,
              customerPhone,
              serviceType: data.serviceType ?? null,
              startsAt,
              endsAt,
              status: "confirmed",
              notes: data.notes
                ? `Booked via AI chatbot. ${data.notes}`
                : "Booked via AI chatbot.",
            },
          });

          // Create notification
          await tx.notification.create({
            data: {
              accountId,
              type: "booking",
              title: "New Appointment Booked by AI",
              message: `${customerName} (${customerPhone}) booked via chatbot for ${startsAt.toLocaleDateString()}.`,
              actionUrl: "/dashboard/services/booking",
            },
          });

          // Activity event
          await tx.activityEvent.create({
            data: {
              clientId,
              type: "call_booked",
              title: "AI chatbot booked appointment",
              description: `${customerName} booked for ${data.serviceType || "consultation"} on ${startsAt.toLocaleDateString()}.`,
            },
          });

          return b;
        });

        return NextResponse.json({
          success: true,
          action: "book_appointment",
          bookingId: booking.id,
          startsAt: startsAt.toISOString(),
        });
      }

      // -------------------------------------------------------------------
      // Send Quote
      // -------------------------------------------------------------------
      case "send_quote": {
        if (!data?.customerName) {
          return NextResponse.json(
            { error: "customerName is required for sending a quote" },
            { status: 400 }
          );
        }

        // Wrap activity + notification in a transaction for atomicity
        await prisma.$transaction(async (tx) => {
          await tx.activityEvent.create({
            data: {
              clientId,
              type: "lead_captured",
              title: "AI chatbot provided quote",
              description: `Quote for ${data.customerName}: ${data.serviceType || "services"} — estimated ${data.estimateRange || "TBD"}.`,
            },
          });

          await tx.notification.create({
            data: {
              accountId,
              type: "lead",
              title: "AI Chatbot Sent Quote Estimate",
              message: `${data.customerName} was given a rough estimate of ${data.estimateRange || "TBD"} for ${data.serviceType || "services"}.`,
              actionUrl: "/dashboard/leads",
            },
          });
        });

        return NextResponse.json({
          success: true,
          action: "send_quote",
          message: `Quote provided to ${data.customerName}`,
        });
      }

      // -------------------------------------------------------------------
      // Follow Up
      // -------------------------------------------------------------------
      case "follow_up": {
        // Mark the conversation's lead for follow-up
        if (conversationId) {
          const conversation = await prisma.chatbotConversation.findUnique({
            where: { id: conversationId },
          });

          if (conversation?.visitorEmail || data?.customerEmail || data?.customerPhone) {
            // Find the lead and update the follow-up date
            const leadWhere: Record<string, unknown> = { clientId };
            if (conversation?.visitorEmail) {
              leadWhere.email = conversation.visitorEmail;
            } else if (data?.customerEmail) {
              leadWhere.email = data.customerEmail;
            } else if (data?.customerPhone) {
              leadWhere.phone = data.customerPhone;
            }

            const lead = await prisma.lead.findFirst({ where: leadWhere });

            if (lead) {
              await prisma.lead.update({
                where: { id: lead.id },
                data: {
                  nextFollowUpAt: new Date(
                    Date.now() + 24 * 60 * 60 * 1000 // follow up in 24 hours
                  ),
                  notes: lead.notes
                    ? `${lead.notes}\nAI flagged for follow-up.`
                    : "AI flagged for follow-up.",
                },
              });
            }
          }
        }

        // Activity event
        await prisma.activityEvent.create({
          data: {
            clientId,
            type: "lead_captured",
            title: "AI chatbot flagged follow-up",
            description: `Follow-up needed for ${data?.customerName || "visitor"} from chatbot conversation.`,
          },
        });

        return NextResponse.json({
          success: true,
          action: "follow_up",
          message: "Follow-up scheduled",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.errorWithCause("[chatbot/actions] Error:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
