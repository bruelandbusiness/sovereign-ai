import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// Default referral program config
const DEFAULT_CONFIG = {
  enabled: false,
  rewardText: "Refer a friend and you both get $25 off!",
  rewardAmount: 2500, // cents
  terms: "Referral reward is applied after the referred customer completes their first service. Limit one reward per referral.",
};

// GET: Fetch referral program config
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const service = await prisma.clientService.findFirst({
      where: { clientId, serviceId: "referral-program" },
    });

    let config = { ...DEFAULT_CONFIG };
    if (service?.config) {
      try {
        const parsed = JSON.parse(service.config) as Partial<typeof DEFAULT_CONFIG>;
        config = { ...DEFAULT_CONFIG, ...parsed };
      } catch {
        // use defaults
      }
    }

    // Get stats using groupBy to avoid loading all referral rows into memory.
    // This replaces the previous pattern of fetching all records and filtering
    // in JavaScript, which caused unnecessary data transfer for large datasets.
    const [totalReferrals, statusCounts] = await Promise.all([
      prisma.customerReferral.count({ where: { clientId } }),
      prisma.customerReferral.groupBy({
        by: ["status"],
        where: { clientId },
        _count: { status: true },
      }),
    ]);

    const countByStatus = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.status])
    );

    const stats = {
      totalReferrals,
      pending: countByStatus["pending"] ?? 0,
      contacted: countByStatus["contacted"] ?? 0,
      converted: countByStatus["converted"] ?? 0,
      rewarded: countByStatus["rewarded"] ?? 0,
    };

    return NextResponse.json({ config, stats, clientId });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[referral-program] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch referral program config" },
      { status: 500 }
    );
  }
}

// POST: Update referral program config
const configSchema = z.object({
  enabled: z.boolean().optional(),
  rewardText: z.string().min(1).optional(),
  rewardAmount: z.number().min(0).optional(),
  terms: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, configSchema);
    if (!validation.success) {
      return validation.response;
    }

    const service = await prisma.clientService.findFirst({
      where: { clientId, serviceId: "referral-program" },
    });

    let existingConfig = { ...DEFAULT_CONFIG };
    if (service?.config) {
      try {
        const parsed = JSON.parse(service.config) as Partial<typeof DEFAULT_CONFIG>;
        existingConfig = { ...DEFAULT_CONFIG, ...parsed };
      } catch {
        // use defaults
      }
    }

    const newConfig = { ...existingConfig, ...validation.data };

    if (service) {
      await prisma.clientService.update({
        where: { id: service.id },
        data: { config: JSON.stringify(newConfig) },
      });
    } else {
      await prisma.clientService.create({
        data: {
          clientId,
          serviceId: "referral-program",
          status: "active",
          config: JSON.stringify(newConfig),
        },
      });
    }

    return NextResponse.json({ config: newConfig });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[referral-program] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to update referral program config" },
      { status: 500 }
    );
  }
}
