import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { generateROIReport } from "@/lib/roi";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/roi-weekly", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const clients = await prisma.client.findMany({
      where: {
        subscription: { status: "active" },
      },
      select: { id: true },
      take: 500,
    });

    const errors: string[] = [];

    // Process clients in parallel batches of 10 to avoid overwhelming the DB
    const BATCH_SIZE = 10;
    let generated = 0;
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = clients.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((client) => generateROIReport(client.id, "weekly")),
      );
      for (let j = 0; j < results.length; j++) {
        if (results[j].status === "fulfilled") {
          generated++;
        } else {
          const reason = (results[j] as PromiseRejectedResult).reason;
          errors.push(
            `Failed for ${batch[j].id}: ${reason instanceof Error ? reason.message : "Unknown"}`,
          );
        }
      }
    }

    logger.info("[cron/roi-weekly] Completed", {
      generated,
      total: clients.length,
      errorCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      generated,
      total: clients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.errorWithCause("[cron/roi-weekly] Cron failed", error);
    return NextResponse.json(
      { error: "Weekly ROI cron failed" },
      { status: 500 },
    );
  }
});
