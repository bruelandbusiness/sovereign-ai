import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

const outcomeSchema = z.object({
  status: z.enum(["contacted", "booked", "won", "lost"]),
  jobValue: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
});

/**
 * PATCH /api/dashboard/leads/[id]/outcome
 *
 * Lets clients update a lead's outcome after contact.
 * When status is "won", a RevenueEvent is created to track the revenue.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireClient();
    const { id: leadId } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const parsed = outcomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { status, jobValue, notes } = parsed.data;

    // Verify the lead belongs to this client
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, clientId },
      select: {
        id: true,
        notes: true,
        value: true,
        lastContactedAt: true,
        source: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 },
      );
    }

    // Map outcome statuses to Lead model statuses
    const statusMap: Record<string, string> = {
      contacted: "qualified",
      booked: "appointment",
      won: "won",
      lost: "lost",
    };

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: statusMap[status] ?? status,
        notes: notes ?? lead.notes,
        value: status === "won" && jobValue ? Math.round(jobValue * 100) : lead.value,
        lastContactedAt:
          status === "contacted" ? new Date() : lead.lastContactedAt,
      },
    });

    // Create a RevenueEvent when a lead is won
    if (status === "won" && jobValue && jobValue > 0) {
      await prisma.revenueEvent.create({
        data: {
          clientId,
          leadId,
          eventType: "payment_received",
          channel: lead.source || "unknown",
          amount: Math.round(jobValue * 100), // store in cents
        },
      });
    }

    return NextResponse.json({
      id: updatedLead.id,
      status: updatedLead.status,
      value: updatedLead.value ? updatedLead.value / 100 : null,
      notes: updatedLead.notes,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause("[leads/outcome] PATCH failed:", error);
    return NextResponse.json(
      { error: "Failed to update lead outcome" },
      { status: 500 },
    );
  }
}
