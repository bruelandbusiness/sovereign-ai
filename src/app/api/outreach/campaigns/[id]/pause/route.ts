import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/outreach/campaigns/[id]/pause — Pause a campaign
// ---------------------------------------------------------------------------

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { id: campaignId } = await params;

  const campaign = await prisma.coldOutreachCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status !== "active") {
    return NextResponse.json(
      { error: "Campaign is not active — cannot pause" },
      { status: 400 }
    );
  }

  const updated = await prisma.coldOutreachCampaign.update({
    where: { id: campaignId },
    data: {
      status: "paused",
      pausedAt: new Date(),
    },
  });

  return NextResponse.json({
    campaign: {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      pausedAt: updated.pausedAt,
    },
  });
}
