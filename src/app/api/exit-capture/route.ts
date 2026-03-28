import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { trackRevenueEvent } from "@/lib/revenue-attribution";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const exitCaptureSchema = z.object({
  email: z.string().email("Enter a valid email"),
  clientId: z.string().min(1).optional(),
});

// ---------------------------------------------------------------------------
// POST — exit-intent email capture
//
// Creates a Lead record with source "exit-intent" and the submitted email.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "exit-capture", 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = exitCaptureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, clientId } = parsed.data;

    if (clientId) {
      // Embedded widget use case — create lead for specific client
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      const lead = await prisma.lead.create({
        data: {
          clientId: client.id,
          name: email.split("@")[0],
          email,
          source: "exit-intent",
          status: "new",
          notes: "Captured via exit-intent popup",
        },
      });

      // Track revenue attribution
      trackRevenueEvent(client.id, {
        leadId: lead.id,
        channel: "exit-intent",
        eventType: "lead_captured",
      }).catch((err) =>
        logger.errorWithCause("[exit-capture] Revenue tracking failed:", err)
      );
    }

    // Platform marketing pages (no clientId) — email captured for UX,
    // but no Lead record since there's no client to associate with.

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.errorWithCause("[api/exit-capture] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
