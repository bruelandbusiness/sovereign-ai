import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const captureSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional().default(""),
  source: z.string().max(50).optional().default("website"),
  trade: z.string().max(50).optional(),
  partnerSlug: z.string().max(100).optional(),
  referralCode: z.string().max(50).optional(),
  clientId: z.string().max(100).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "lead-capture", 10);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      ),
      rl
    );
  }

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const parsed = captureSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const lead = await prisma.prospectLead.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        source: body.source || "website",
        trade: body.trade || null,
        partnerSlug: body.partnerSlug || null,
        referralCode: body.referralCode || null,
        utmSource: body.utmSource || null,
        utmMedium: body.utmMedium || null,
        utmCampaign: body.utmCampaign || null,
        metadata: body.metadata
          ? (JSON.parse(JSON.stringify(body.metadata)) as object)
          : undefined,
      },
    });

    // Auto-send nurture email sequence for free-audit funnel leads
    const isFunnelLead = body.source === "audit" || body.source === "vsl";
    if (isFunnelLead) {
      try {
        const { NURTURE_SEQUENCE, renderNurtureEmail } = await import(
          "@/lib/funnel-emails"
        );
        const { queueEmail } = await import("@/lib/email-queue");

        // Send the first email immediately (day 0 — "Your audit is ready")
        const firstEmail = NURTURE_SEQUENCE[0];
        const htmlContent = renderNurtureEmail(firstEmail, {
          name: lead.name,
          trade: lead.trade || undefined,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}`,
        });

        await queueEmail(lead.email, firstEmail.subject, htmlContent);

        // Queue remaining emails with appropriate delays
        for (let i = 1; i < NURTURE_SEQUENCE.length; i++) {
          const email = NURTURE_SEQUENCE[i];
          const scheduledAt = new Date(
            Date.now() + email.dayOffset * 24 * 60 * 60 * 1000
          );

          const emailHtml = renderNurtureEmail(email, {
            name: lead.name,
            trade: lead.trade || undefined,
            unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(lead.email)}`,
          });

          await queueEmail(lead.email, email.subject, emailHtml, {
            scheduledAt,
          });
        }
      } catch (err) {
        // Nurture email send is best-effort — don't fail the lead capture
        logger.errorWithCause("[leads/capture] Nurture email queue failed:", err);
      }
    }

    // Auto-enroll in follow-up sequence if configured
    if (body.clientId) {
      try {
        const { enrollInFollowUp } = await import("@/lib/followup");
        const followUpSeq = await prisma.followUpSequence.findFirst({
          where: { clientId: body.clientId, triggerType: "lead_captured", isActive: true },
          select: { id: true },
        });
        if (followUpSeq) {
          await enrollInFollowUp({
            clientId: body.clientId,
            sequenceId: followUpSeq.id,
            leadId: lead.id,
            contactEmail: lead.email ?? undefined,
            contactPhone: lead.phone ?? undefined,
            contactName: lead.name ?? undefined,
          });
        }
      } catch (err) {
        // Follow-up enrollment is best-effort — don't fail the lead capture
        logger.errorWithCause("[leads/capture] Follow-up enrollment failed:", err);
      }
    }

    return setRateLimitHeaders(
      NextResponse.json({ success: true, id: lead.id }),
      rl
    );
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to capture lead" },
      { status: 500 }
    );
  }
}
