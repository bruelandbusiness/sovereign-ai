import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const sendEmailSchema = z.object({
  campaignId: z.string().min(1, "campaignId is required").max(100),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 campaign sends per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "email-campaign-send", 10);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const clientId = session.account.client.id;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendEmailSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parsed.data;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: body.campaignId },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  if (campaign.clientId !== clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Update campaign status to active and set sentAt timestamp
  const updated = await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      status: "active",
      sentAt: new Date(),
    },
  });

  // Send campaign emails via the queue for rate limiting, retry, and
  // bounce/unsubscribe suppression (handled by processEmailQueue).
  const { queueEmail } = await import("@/lib/email-queue");
  const { emailLayout } = await import("@/lib/email");
  const leads = await prisma.lead.findMany({
    where: { clientId, email: { not: null } },
    select: { email: true },
  });

  // Wrap campaign body in standard layout with unsubscribe link (CAN-SPAM)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
  const campaignHtml = emailLayout({
    body: campaign.body,
    unsubscribeUrl: `${appUrl}/unsubscribe`,
  });

  let sentCount = 0;
  for (const lead of leads) {
    if (lead.email) {
      try {
        await queueEmail(lead.email, campaign.subject, campaignHtml, {
          clientId,
        });
        sentCount++;
      } catch {
        // Skip leads that fail to queue (e.g. bounced recipients)
      }
    }
  }

  // Update recipient count
  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: { recipients: sentCount },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "email_sent",
      title: `Campaign sent: ${campaign.name}`,
      description: `Email campaign "${campaign.subject}" has been sent to recipients.`,
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    subject: updated.subject,
    status: updated.status,
    sentAt: updated.sentAt?.toISOString() ?? null,
  });
}
