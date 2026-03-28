import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { NURTURE_SEQUENCE, renderNurtureEmail } from "@/lib/funnel-emails";
import { scoreLead } from "@/lib/lead-scoring";
import { trackRevenueEvent } from "@/lib/revenue-attribution";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const captureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  business: z.string().optional(),
  trade: z.string().optional(),
  source: z.enum([
    "free-audit",
    "webinar",
    "playbook",
    "strategy-call",
  ]),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "funnel-capture", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const parsed = captureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, business, trade, source, utmSource, utmMedium, utmCampaign } = parsed.data;

    // Score the lead
    const leadSource = `funnel-${source}${trade ? `-${trade}` : ""}`;
    const score = scoreLead({
      email,
      phone: phone || null,
      source: "form",
      status: "new",
      notes: business || null,
      createdAt: new Date(),
    });

    // Store as a lead in the database (no client association — platform marketing lead)
    const clientId = (await prisma.client.findFirst({ select: { id: true } }))
      ?.id ?? "";

    const lead = await prisma.lead.create({
      data: {
        clientId,
        name,
        email,
        phone: phone || null,
        source: leadSource,
        status: "new",
        score,
        notes: [
          business ? `Business: ${business}` : null,
          trade ? `Trade: ${trade}` : null,
          `Funnel source: ${source}`,
          `Lead score: ${score}`,
          utmSource ? `utm_source: ${utmSource}` : null,
          utmMedium ? `utm_medium: ${utmMedium}` : null,
          utmCampaign ? `utm_campaign: ${utmCampaign}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      },
    });

    // Track revenue attribution event
    trackRevenueEvent(clientId, {
      leadId: lead.id,
      channel: `funnel-${source}`,
      eventType: "lead_captured",
      metadata: { trade, business, score, utmSource, utmMedium, utmCampaign },
    }).catch((err) =>
      logger.errorWithCause("[funnel-capture] Revenue tracking failed:", err)
    );

    // Send the first nurture email immediately (Day 0 — Welcome)
    const firstEmail = NURTURE_SEQUENCE[0];
    if (firstEmail) {
      const html = renderNurtureEmail(firstEmail, {
        name,
        trade,
      });
      // Fire and forget — don't block the response
      sendEmail(email, firstEmail.subject, html).catch((err) =>
        logger.errorWithCause("[funnel-capture] Welcome email failed:", err)
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.errorWithCause("[api/funnel-capture] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
