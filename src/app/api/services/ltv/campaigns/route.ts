import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  vertical: z.string().min(1).max(100),
  season: z.string().min(1).max(100),
  triggerMonth: z.coerce.number().int().min(1).max(12),
  subject: z.string().min(1).max(500),
  campaignBody: z.string().min(1).max(5000),
  discount: z.string().max(100).nullable().optional(),
});

const updateCampaignSchema = z.object({
  id: z.string().min(1, "Campaign id is required"),
  isActive: z.boolean().optional(),
  name: z.string().max(200).optional(),
  subject: z.string().max(500).optional(),
  campaignBody: z.string().max(5000).optional(),
  discount: z.string().max(100).nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const campaigns = await prisma.seasonalCampaign.findMany({
    where: { clientId },
    orderBy: { triggerMonth: "asc" },
    take: 50,
  });

  return NextResponse.json(
    campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      vertical: c.vertical,
      season: c.season,
      triggerMonth: c.triggerMonth,
      subject: c.subject,
      body: c.body,
      discount: c.discount,
      isActive: c.isActive,
      lastRunAt: c.lastRunAt?.toISOString() || null,
      totalSent: c.totalSent,
      totalBooked: c.totalBooked,
      totalRevenue: c.totalRevenue,
      createdAt: c.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createCampaignSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, vertical, season, triggerMonth, subject, campaignBody, discount } = parsed.data;
    const clientId = session.account.client.id;

    const campaign = await prisma.seasonalCampaign.create({
      data: {
        clientId,
        name,
        vertical,
        season,
        triggerMonth,
        subject,
        body: campaignBody,
        discount: discount || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        id: campaign.id,
        name: campaign.name,
        vertical: campaign.vertical,
        season: campaign.season,
        triggerMonth: campaign.triggerMonth,
        subject: campaign.subject,
        body: campaign.body,
        discount: campaign.discount,
        isActive: campaign.isActive,
        lastRunAt: null,
        totalSent: 0,
        totalBooked: 0,
        totalRevenue: 0,
        createdAt: campaign.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create seasonal campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateCampaignSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, isActive, name, subject, campaignBody, discount } = parsed.data;

    const clientId = session.account.client.id;

    // Verify ownership
    const existing = await prisma.seasonalCampaign.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (campaignBody) updateData.body = campaignBody;
    if (discount !== undefined) updateData.discount = discount || null;

    const updated = await prisma.seasonalCampaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      vertical: updated.vertical,
      season: updated.season,
      triggerMonth: updated.triggerMonth,
      subject: updated.subject,
      body: updated.body,
      discount: updated.discount,
      isActive: updated.isActive,
      lastRunAt: updated.lastRunAt?.toISOString() || null,
      totalSent: updated.totalSent,
      totalBooked: updated.totalBooked,
      totalRevenue: updated.totalRevenue,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    logger.errorWithCause("Campaign update error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}
