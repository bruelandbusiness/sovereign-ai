import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { enrichLead, enrichDiscoveredLead } from "@/lib/enrichment";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/enrichment-run
 * Daily cron job to enrich leads and discovered leads that have not yet been
 * processed. Runs in batches of 50 to stay within execution limits.
 * Schedule: 0 6 * * * (daily at 6 AM)
 */
export const GET = withCronErrorHandler("cron/enrichment-run", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();

  try {
    // ── Leads needing enrichment ──────────────────────────────────
    // Leads that have no enrichment record yet, or whose record is
    // still in "pending" status.
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          {
            id: {
              notIn: (
                await prisma.enrichmentRecord.findMany({
                  where: { leadId: { not: null } },
                  select: { leadId: true },
                })
              )
                .map((r) => r.leadId)
                .filter((id): id is string => id !== null),
            },
          },
        ],
        status: { in: ["new", "contacted"] },
      },
      select: { id: true, clientId: true },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    // ── Discovered leads needing enrichment ───────────────────────
    const discoveredLeads = await prisma.discoveredLead.findMany({
      where: {
        status: { in: ["new", "enriching"] },
        id: {
          notIn: (
            await prisma.enrichmentRecord.findMany({
              where: { discoveredLeadId: { not: null }, status: "complete" },
              select: { discoveredLeadId: true },
            })
          )
            .map((r) => r.discoveredLeadId)
            .filter((id): id is string => id !== null),
        },
      },
      select: { id: true, clientId: true },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    let enrichedLeads = 0;
    let enrichedDiscovered = 0;
    const errors: Array<{ id: string; type: string; error: string }> = [];

    // Process leads individually so one failure does not abort the batch
    for (const lead of leads) {
      try {
        await enrichLead(lead.clientId, lead.id);
        enrichedLeads++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        errors.push({ id: lead.id, type: "lead", error: msg });
        logger.errorWithCause(
          `[cron/enrichment-run] Failed to enrich lead ${lead.id}`,
          error,
        );
      }
    }

    for (const dl of discoveredLeads) {
      try {
        await enrichDiscoveredLead(dl.clientId, dl.id);
        enrichedDiscovered++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        errors.push({ id: dl.id, type: "discovered_lead", error: msg });
        logger.errorWithCause(
          `[cron/enrichment-run] Failed to enrich discovered lead ${dl.id}`,
          error,
        );
      }
    }

    logger.info(
      `[cron/enrichment-run] Completed in ${Date.now() - startTime}ms`,
      {
        leadsProcessed: leads.length,
        discoveredLeadsProcessed: discoveredLeads.length,
        enrichedLeads,
        enrichedDiscovered,
        errors: errors.length,
      },
    );

    return NextResponse.json({
      leadsProcessed: leads.length,
      discoveredLeadsProcessed: discoveredLeads.length,
      enrichedLeads,
      enrichedDiscovered,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.errorWithCause("[cron/enrichment-run] Fatal error", error);
    return NextResponse.json(
      { error: "Enrichment cron failed" },
      { status: 500 },
    );
  }
});
