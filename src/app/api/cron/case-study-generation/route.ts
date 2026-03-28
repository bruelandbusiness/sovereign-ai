import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { generateCaseStudy } from "@/lib/acquisition/proof-engine";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_PER_RUN = 5;
const MIN_DAYS_ACTIVE = 90;

export const GET = withCronErrorHandler("cron/case-study-generation", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  logger.info("[cron/case-study-generation] Starting case study generation run");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MIN_DAYS_ACTIVE);

  // Find clients with 90+ days of data and no existing case study
  const existingCaseStudyClientIds = await prisma.caseStudy.findMany({
    select: { clientId: true },
    distinct: ["clientId"],
  });
  const excludeIds = existingCaseStudyClientIds.map((cs) => cs.clientId);

  const eligibleClients = await prisma.client.findMany({
    where: {
      createdAt: { lte: cutoffDate },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    select: { id: true, businessName: true },
    take: MAX_PER_RUN,
    orderBy: { createdAt: "asc" },
  });

  if (eligibleClients.length === 0) {
    logger.info(
      "[cron/case-study-generation] No eligible clients found for case study generation"
    );
    return NextResponse.json({
      processed: 0,
      message: "No eligible clients found",
    });
  }

  const results = [];

  for (const client of eligibleClients) {
    try {
      const caseStudyId = await generateCaseStudy(client.id);
      results.push({
        clientId: client.id,
        businessName: client.businessName,
        caseStudyId,
        status: "generated",
      });
    } catch (err) {
      logger.errorWithCause(
        `[cron/case-study-generation] Failed for client: ${client.businessName}`,
        err
      );
      results.push({
        clientId: client.id,
        businessName: client.businessName,
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const successCount = results.filter((r) => r.status === "generated").length;

  logger.info("[cron/case-study-generation] Run complete", {
    eligible: eligibleClients.length,
    generated: successCount,
  });

  return NextResponse.json({
    processed: eligibleClients.length,
    generated: successCount,
    results,
  });
});
