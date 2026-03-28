import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const updateConfigSchema = z.object({
  physicalAddress: z.string().min(10).optional(),
  fromName: z.string().min(1).optional(),
  fromEmail: z.string().email().optional(),
  tcpaConsentRequired: z.boolean().optional(),
  smsQuietStartHour: z.number().int().min(0).max(23).optional(),
  smsQuietEndHour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().min(1).optional(),
  maxContactAttempts: z.number().int().min(1).max(20).optional(),
  cooldownDays: z.number().int().min(1).max(365).optional(),
  dataPurgeDays: z.number().int().min(30).max(365).optional(),
});

/**
 * GET /api/compliance/config/[clientId]
 * Get compliance config and stats for a client.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId: sessionClientId } = await requireClient();
    const { clientId } = await params;

    // Clients can only see their own config
    if (sessionClientId !== clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = await prisma.complianceConfig.findUnique({
      where: { clientId },
    });

    if (!config) {
      return NextResponse.json({
        config: null,
        message: "No compliance config set. Create one to enable outreach compliance.",
      });
    }

    // Get suppression list count for stats
    const suppressionCount = await prisma.suppressionList.count({
      where: { clientId },
    });

    const consentCount = await prisma.consentRecord.count({
      where: { clientId, revokedAt: null },
    });

    return NextResponse.json({
      config,
      stats: {
        suppressedContacts: suppressionCount,
        activeConsents: consentCount,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.errorWithCause("[compliance/config] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance config" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/compliance/config/[clientId]
 * Create or update compliance config for a client.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId: sessionClientId } = await requireClient();
    const { clientId } = await params;

    if (sessionClientId !== clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.complianceConfig.findUnique({
      where: { clientId },
    });

    if (existing) {
      const updated = await prisma.complianceConfig.update({
        where: { clientId },
        data: parsed.data,
      });
      return NextResponse.json({ config: updated });
    }

    // Creating a new config requires all required fields
    if (
      !parsed.data.physicalAddress ||
      !parsed.data.fromName ||
      !parsed.data.fromEmail
    ) {
      return NextResponse.json(
        {
          error:
            "physicalAddress, fromName, and fromEmail are required when creating a new config",
        },
        { status: 400 }
      );
    }

    const created = await prisma.complianceConfig.create({
      data: {
        clientId,
        physicalAddress: parsed.data.physicalAddress,
        fromName: parsed.data.fromName,
        fromEmail: parsed.data.fromEmail,
        ...(parsed.data.tcpaConsentRequired !== undefined && {
          tcpaConsentRequired: parsed.data.tcpaConsentRequired,
        }),
        ...(parsed.data.smsQuietStartHour !== undefined && {
          smsQuietStartHour: parsed.data.smsQuietStartHour,
        }),
        ...(parsed.data.smsQuietEndHour !== undefined && {
          smsQuietEndHour: parsed.data.smsQuietEndHour,
        }),
        ...(parsed.data.timezone && { timezone: parsed.data.timezone }),
        ...(parsed.data.maxContactAttempts !== undefined && {
          maxContactAttempts: parsed.data.maxContactAttempts,
        }),
        ...(parsed.data.cooldownDays !== undefined && {
          cooldownDays: parsed.data.cooldownDays,
        }),
        ...(parsed.data.dataPurgeDays !== undefined && {
          dataPurgeDays: parsed.data.dataPurgeDays,
        }),
      },
    });

    return NextResponse.json({ config: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.errorWithCause("[compliance/config] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update compliance config" },
      { status: 500 }
    );
  }
}
