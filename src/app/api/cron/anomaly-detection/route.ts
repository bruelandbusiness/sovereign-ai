import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron";
import { detectClientAnomalies } from "@/lib/governance/anomaly";
import { expireStaleApprovals } from "@/lib/governance/approvals";
import { logger } from "@/lib/logger";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/anomaly-detection] Starting anomaly detection");

    // Expire stale approval requests
    const expired = await expireStaleApprovals();

    // Get all active clients
    const clients = await prisma.client.findMany({
      where: {
        subscription: { status: "active" },
      },
      select: { id: true },
      take: 100,
    });

    let totalAnomalies = 0;
    const errors: string[] = [];

    // Batch-fetch all leads for all clients in a single query to avoid N+1.
    // Previously, detectClientAnomalies issued 1 query per client.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const clientIds = clients.map((c) => c.id);
    const allLeads = await prisma.lead.findMany({
      where: {
        clientId: { in: clientIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { clientId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group lead dates by clientId for O(1) lookup
    const leadDatesByClient = new Map<string, Date[]>();
    for (const lead of allLeads) {
      const dates = leadDatesByClient.get(lead.clientId);
      if (dates) {
        dates.push(lead.createdAt);
      } else {
        leadDatesByClient.set(lead.clientId, [lead.createdAt]);
      }
    }

    for (const client of clients) {
      try {
        const leadDates = leadDatesByClient.get(client.id) || [];
        const count = await detectClientAnomalies(client.id, leadDates);
        totalAnomalies += count;
      } catch (err) {
        const message = `Failed to detect anomalies for client ${client.id}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`;
        logger.error(`[cron/anomaly-detection] ${message}`);
        errors.push(message);
      }
    }

    logger.info(
      `[cron/anomaly-detection] Done: ${clients.length} clients checked, ${totalAnomalies} anomalies detected`
    );

    return NextResponse.json({
      ok: true,
      clientsChecked: clients.length,
      anomaliesDetected: totalAnomalies,
      approvalsExpired: expired,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.errorWithCause("[cron/anomaly-detection] Fatal error", err);
    return NextResponse.json(
      { error: "Anomaly detection cron job failed" },
      { status: 500 }
    );
  }
}
