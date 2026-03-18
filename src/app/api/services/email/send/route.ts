import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  let body: { campaignId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.campaignId) {
    return NextResponse.json(
      { error: "campaignId is required" },
      { status: 400 }
    );
  }

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

  // In production this would send via SendGrid to actual recipients.
  // For now, just log the send and record the activity.
  console.log(
    `[EMAIL SEND] Campaign "${campaign.name}" (${campaign.id}) marked as sent for client ${clientId}`
  );

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
