import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { calculateTodayLimit } from "@/lib/outreach/sender";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/outreach/campaigns/[id]/stats — Campaign analytics
// ---------------------------------------------------------------------------

export async function GET(
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
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Count recipients by status
  const statusCounts = await prisma.coldEmailRecipient.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { id: true },
  });

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of statusCounts) {
    counts[row.status] = row._count.id;
    total += row._count.id;
  }

  const sent = counts["sent"] ?? 0;
  const opened = counts["opened"] ?? 0;
  const clicked = counts["clicked"] ?? 0;
  const replied = counts["replied"] ?? 0;
  const bounced = counts["bounced"] ?? 0;
  const pending = counts["pending"] ?? 0;
  const unsubscribed = counts["unsubscribed"] ?? 0;

  // Engagement includes sent + opened + clicked + replied (all delivered and engaged)
  const delivered = sent + opened + clicked + replied;

  const openRate = delivered > 0 ? ((opened + clicked + replied) / delivered) * 100 : 0;
  const clickRate = delivered > 0 ? ((clicked + replied) / delivered) * 100 : 0;
  const replyRate = delivered > 0 ? (replied / delivered) * 100 : 0;
  const bounceRate = total > 0 ? (bounced / total) * 100 : 0;

  // Today's warmup limit
  const todayLimit = calculateTodayLimit(campaign);

  // Sent today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sentToday = await prisma.coldEmailRecipient.count({
    where: {
      campaignId,
      sentAt: { gte: todayStart },
      status: { in: ["sent", "opened", "clicked", "replied"] },
    },
  });

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      startedAt: campaign.startedAt,
    },
    stats: {
      total,
      pending,
      sent,
      opened,
      clicked,
      replied,
      bounced,
      unsubscribed,
      delivered,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      replyRate: Math.round(replyRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
    },
    warmup: {
      todayLimit,
      sentToday,
      remaining: Math.max(0, todayLimit - sentToday),
    },
  });
}
