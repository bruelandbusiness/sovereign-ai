import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { scoreLead } from "@/lib/lead-scoring";
import { trackRevenueEvent } from "@/lib/revenue-attribution";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  business: z.string().min(1, "Business name is required").max(200),
  phone: z.string().max(30).optional(),
  interest: z.enum([
    "ai-call-answering",
    "lead-generation",
    "review-management",
    "full-platform",
    "not-sure",
  ]),
  webinarDate: z.string().min(1, "Please select a webinar date"),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "webinar-register", 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
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

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      business,
      phone,
      interest,
      webinarDate,
      utmSource,
      utmMedium,
      utmCampaign,
    } = parsed.data;

    const score = scoreLead({
      email,
      phone: phone || null,
      source: "form",
      status: "new",
      notes: business,
      createdAt: new Date(),
    });

    const clientId =
      (await prisma.client.findFirst({ select: { id: true } }))?.id ?? "";

    const lead = await prisma.lead.create({
      data: {
        clientId,
        name,
        email,
        phone: phone || null,
        source: "webinar-registration",
        status: "new",
        score,
        notes: [
          `Business: ${business}`,
          `Interest: ${interest}`,
          `Webinar date: ${webinarDate}`,
          `Lead score: ${score}`,
          utmSource ? `utm_source: ${utmSource}` : null,
          utmMedium ? `utm_medium: ${utmMedium}` : null,
          utmCampaign ? `utm_campaign: ${utmCampaign}` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      },
    });

    // Audit log
    logAudit({
      accountId: null,
      action: "webinar.register",
      resource: "lead",
      resourceId: lead.id,
      metadata: { interest, webinarDate, business },
    }).catch((err) =>
      logger.errorWithCause("[webinar/register] Audit log failed:", err),
    );

    // Revenue attribution
    trackRevenueEvent(clientId, {
      leadId: lead.id,
      channel: "webinar-registration",
      eventType: "lead_captured",
      metadata: {
        interest,
        webinarDate,
        business,
        score,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    }).catch((err) =>
      logger.errorWithCause("[webinar/register] Revenue tracking failed:", err),
    );

    // Send confirmation email (fire and forget)
    const confirmationHtml = buildConfirmationEmail(name, webinarDate);
    sendEmail(
      email,
      "You're Registered: Sovereign AI Live Demo",
      confirmationHtml,
    ).catch((err) =>
      logger.errorWithCause(
        "[webinar/register] Confirmation email failed:",
        err,
      ),
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.errorWithCause("[api/webinar/register] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function buildConfirmationEmail(name: string, webinarDate: string): string {
  const firstName = name.split(" ")[0] || name;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#0a0a0f;font-size:24px;margin:0;">Sovereign AI</h1>
    </div>
    <h2 style="color:#0a0a0f;font-size:20px;">Hey ${firstName}, you're registered!</h2>
    <p style="color:#555;font-size:16px;line-height:1.6;">
      You've secured your spot for the <strong>Sovereign AI Live Demo</strong> on
      <strong>${webinarDate}</strong>.
    </p>
    <p style="color:#555;font-size:16px;line-height:1.6;">Here's what you'll learn:</p>
    <ul style="color:#555;font-size:15px;line-height:1.8;">
      <li>How AI answers 100% of your calls — so you never miss a lead</li>
      <li>How to generate 50+ qualified leads per month on autopilot</li>
      <li>How automated review management protects your reputation</li>
      <li>A live walkthrough of the Sovereign AI dashboard</li>
    </ul>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.trysovereignai.com/webinar" style="display:inline-block;background:linear-gradient(135deg,#4c85ff,#22d3a1);background-color:#4c85ff;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        Add to Calendar
      </a>
    </div>
    <p style="color:#555;font-size:14px;line-height:1.6;">
      We'll send you a reminder email before the session. If you have any questions,
      reply to this email — a real human will get back to you.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
    <p style="color:#999;font-size:12px;text-align:center;">
      Sovereign AI, Inc.<br />
      <a href="https://www.trysovereignai.com/unsubscribe" style="color:#999;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</body></html>`;
}
