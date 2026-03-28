import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { emitEvent } from "@/lib/orchestration/events";
import { createNotificationForClient } from "@/lib/notifications";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const requestSchema = z.object({
  clientId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional(),
  serviceNeeded: z.string().max(500).optional(),
  message: z.string().max(5000).optional(),
});

/**
 * POST /api/find-a-pro/request
 *
 * Public endpoint — creates a lead from a homeowner quote request.
 * No authentication required (consumer-facing form submission).
 *
 * Body:
 *   clientId      — target business client ID (required)
 *   name          — homeowner name (required)
 *   email         — homeowner email (required)
 *   phone         — homeowner phone (optional)
 *   serviceNeeded — type of service requested (optional)
 *   message       — additional details (optional)
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per IP per hour
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "find-a-pro-request", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { clientId, name, email, phone, serviceNeeded, message } = parsed.data;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Wrap lead + activity + notification in a transaction so they succeed
    // or fail atomically (prevents orphaned leads without notifications).
    const lead = await prisma.$transaction(async (tx) => {
      const l = await tx.lead.create({
        data: {
          clientId: client.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          source: "marketplace",
          status: "new",
          score: 60, // Marketplace leads get a moderate initial score
          stage: "new",
          notes: JSON.stringify({
            serviceNeeded: serviceNeeded || "General Inquiry",
            message: message?.trim() || null,
            source: "find-a-pro",
          }),
        },
      });

      // Create an activity event for the target client
      await tx.activityEvent.create({
        data: {
          clientId: client.id,
          type: "lead_captured",
          title: "New Marketplace Lead",
          description: `${name.trim()} submitted a quote request via Find-a-Pro${serviceNeeded ? ` for ${serviceNeeded}` : ""}.`,
        },
      });

      return l;
    });

    // Emit orchestration event and send notification outside the transaction
    // (these involve external systems and should not block the core write)
    await emitEvent("lead.created", { leadId: lead.id, leadName: lead.name || "Marketplace visitor", source: "marketplace" }, { clientId: client.id, source: "marketplace" });

    // Notify the business owner about the new Find-a-Pro lead
    await createNotificationForClient(client.id, {
      type: "lead",
      title: "New Find-a-Pro Lead",
      message: `${name.trim()} submitted a quote request${serviceNeeded ? ` for ${serviceNeeded}` : ""} via the marketplace.`,
      actionUrl: "/dashboard/leads",
    });

    return NextResponse.json({
      data: {
        id: lead.id,
        message: "Quote request submitted successfully",
      },
    });
  } catch (error) {
    logger.errorWithCause("[find-a-pro/request] Error:", error);
    return NextResponse.json(
      { error: "Failed to submit quote request" },
      { status: 500 }
    );
  }
}
