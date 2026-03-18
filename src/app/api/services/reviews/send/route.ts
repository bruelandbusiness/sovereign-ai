import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendReviewRequestEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    const clientId = session.account.client.id;
    const businessName = session.account.client.businessName;

    // Look up the campaign and verify it belongs to this client
    const campaign = await prisma.reviewCampaign.findFirst({
      where: { id: campaignId, clientId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status !== "pending") {
      return NextResponse.json(
        { error: "Campaign has already been sent" },
        { status: 400 }
      );
    }

    if (!campaign.reviewUrl) {
      return NextResponse.json(
        { error: "Campaign has no review URL configured" },
        { status: 400 }
      );
    }

    // Send the review request email
    await sendReviewRequestEmail(
      campaign.customerEmail,
      campaign.customerName,
      businessName,
      campaign.reviewUrl
    );

    // Update the campaign status and sentAt timestamp
    const updated = await prisma.reviewCampaign.update({
      where: { id: campaignId },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    // Log an activity event
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "email_sent",
        title: "Review request sent",
        description: `Review request email sent to ${campaign.customerName} (${campaign.customerEmail})`,
      },
    });

    return NextResponse.json({
      success: true,
      campaignId: updated.id,
      status: updated.status,
      sentAt: updated.sentAt?.toISOString() || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send review request" },
      { status: 500 }
    );
  }
}
