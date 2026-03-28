import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const campaignCreateSchema = z.object({
  name: z.string().min(1).max(200),
  fromEmail: z.string().email().max(255),
  fromName: z.string().min(1).max(200),
  subjectVariants: z.array(z.string().min(1).max(500)).min(1).max(10),
  bodyTemplate: z.string().min(1).max(50_000),
  dailySendLimit: z.number().int().min(1).max(1000).optional().default(50),
  warmupEnabled: z.boolean().optional().default(true),
  warmupStartSent: z.number().int().min(1).max(100).optional().default(5),
  warmupRampRate: z.number().int().min(1).max(50).optional().default(3),
  sequenceStep: z.number().int().min(1).max(5).optional().default(1),
  dayOffset: z.number().int().min(0).max(30).optional().default(0),
});

// ---------------------------------------------------------------------------
// GET /api/outreach/campaigns — List all campaigns
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const campaigns = await prisma.coldOutreachCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { recipients: true },
      },
    },
  });

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      fromEmail: c.fromEmail,
      fromName: c.fromName,
      dailySendLimit: c.dailySendLimit,
      warmupEnabled: c.warmupEnabled,
      sequenceStep: c.sequenceStep,
      dayOffset: c.dayOffset,
      recipientCount: c._count.recipients,
      startedAt: c.startedAt,
      pausedAt: c.pausedAt,
      createdAt: c.createdAt,
    })),
  });
}

// ---------------------------------------------------------------------------
// POST /api/outreach/campaigns — Create a new campaign
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const body = await request.json();
  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const campaign = await prisma.coldOutreachCampaign.create({
    data: {
      name: data.name,
      fromEmail: data.fromEmail,
      fromName: data.fromName,
      subjectVariants: JSON.stringify(data.subjectVariants),
      bodyTemplate: data.bodyTemplate,
      dailySendLimit: data.dailySendLimit,
      warmupEnabled: data.warmupEnabled,
      warmupStartSent: data.warmupStartSent,
      warmupRampRate: data.warmupRampRate,
      sequenceStep: data.sequenceStep,
      dayOffset: data.dayOffset,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
