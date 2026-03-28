import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const updateReceptionistConfigSchema = z.object({
  greeting: z.string().max(500).optional(),
  systemPrompt: z.string().max(5000).optional(),
  voiceId: z.string().max(100).optional(),
  businessName: z.string().max(200).optional(),
  businessHours: z.string().max(500).optional(),
  afterHoursMsg: z.string().max(500).optional(),
  emergencyAction: z.string().max(200).optional(),
  emergencyPhone: z.string().max(50).optional().nullable(),
  emergencyKeywords: z.array(z.string().max(100)).max(50).optional(),
  collectInfo: z.array(z.string().max(100)).max(20).optional(),
  maxCallMinutes: z.number().int().min(1).max(60).optional(),
  canBookJobs: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET — Retrieve AI Receptionist config for the authenticated client
// ---------------------------------------------------------------------------

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const config = await prisma.receptionistConfig.findUnique({
    where: { clientId },
  });

  if (!config) {
    return NextResponse.json(
      { error: "AI Receptionist not provisioned" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: config.id,
    isActive: config.isActive,
    greeting: config.greeting,
    businessName: config.businessName,
    businessHours: config.businessHours,
    afterHoursMsg: config.afterHoursMsg,
    emergencyKeywords: config.emergencyKeywords,
    emergencyAction: config.emergencyAction,
    emergencyPhone: config.emergencyPhone,
    voiceId: config.voiceId,
    maxCallMinutes: config.maxCallMinutes,
    collectInfo: config.collectInfo,
    canBookJobs: config.canBookJobs,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  });
}

// ---------------------------------------------------------------------------
// PUT — Update AI Receptionist config
// ---------------------------------------------------------------------------

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.account.client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = session.account.client.id;

    const existing = await prisma.receptionistConfig.findUnique({
      where: { clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "AI Receptionist not provisioned" },
        { status: 404 }
      );
    }

    const validation = await validateBody(request, updateReceptionistConfigSchema);
    if (!validation.success) return validation.response;

    const body = validation.data;
    const data: Record<string, unknown> = {};

    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.greeting !== undefined) data.greeting = body.greeting;
    if (body.businessName !== undefined) data.businessName = body.businessName;
    if (body.businessHours !== undefined) data.businessHours = body.businessHours;
    if (body.afterHoursMsg !== undefined) data.afterHoursMsg = body.afterHoursMsg;
    if (body.emergencyKeywords !== undefined) data.emergencyKeywords = body.emergencyKeywords;
    if (body.emergencyAction !== undefined) data.emergencyAction = body.emergencyAction;
    if (body.emergencyPhone !== undefined) data.emergencyPhone = body.emergencyPhone;
    if (body.voiceId !== undefined) data.voiceId = body.voiceId;
    if (body.maxCallMinutes !== undefined) data.maxCallMinutes = body.maxCallMinutes;
    if (body.collectInfo !== undefined) data.collectInfo = body.collectInfo;
    if (body.canBookJobs !== undefined) data.canBookJobs = body.canBookJobs;
    if (body.systemPrompt !== undefined) data.systemPrompt = body.systemPrompt;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.receptionistConfig.update({
      where: { clientId },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      isActive: updated.isActive,
      greeting: updated.greeting,
      businessName: updated.businessName,
      businessHours: updated.businessHours,
      afterHoursMsg: updated.afterHoursMsg,
      emergencyKeywords: updated.emergencyKeywords,
      emergencyAction: updated.emergencyAction,
      emergencyPhone: updated.emergencyPhone,
      voiceId: updated.voiceId,
      maxCallMinutes: updated.maxCallMinutes,
      collectInfo: updated.collectInfo,
      canBookJobs: updated.canBookJobs,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.errorWithCause("Receptionist config update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
