import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import {
  buildWeeklyReportEmail,
  type WeeklyReportMetrics,
} from "@/lib/emails/weekly-report";
import { sendEmailQueued } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Compute the Monday-aligned ISO week start for dedup resource IDs.
 * Returns a string like "2026-03-23".
 */
function getWeekStartISO(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  // Shift Sunday (0) to 7 so Monday is day 1
  const diff = (day === 0 ? 7 : day) - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export const GET = withCronErrorHandler(
  "cron/weekly-report",
  async (request) => {
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weekStart = getWeekStartISO(now);

    // Get all active clients
    const clients = await prisma.client.findMany({
      where: { subscription: { status: "active" } },
      include: {
        account: { select: { id: true, email: true } },
      },
      take: 500,
    });

    if (clients.length === 0) {
      return NextResponse.json({ success: true, sent: 0, total: 0 });
    }

    const clientIds = clients.map((c) => c.id);

    // Batch-fetch metrics to avoid N+1 queries
    const [
      leadsThisWeek,
      leadsLastWeek,
      bookingsThisWeek,
      bookingsLastWeek,
      revenueThisWeek,
      revenueLastWeek,
      reviewsThisWeek,
      topSourceRows,
    ] = await Promise.all([
      prisma.lead
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            createdAt: { gte: oneWeekAgo },
          },
        })
        .then(
          (rows) => new Map(rows.map((r) => [r.clientId, r._count.id])),
        ),
      prisma.lead
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
          },
        })
        .then(
          (rows) => new Map(rows.map((r) => [r.clientId, r._count.id])),
        ),
      prisma.booking
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            createdAt: { gte: oneWeekAgo },
          },
        })
        .then(
          (rows) => new Map(rows.map((r) => [r.clientId, r._count.id])),
        ),
      prisma.booking
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
          },
        })
        .then(
          (rows) => new Map(rows.map((r) => [r.clientId, r._count.id])),
        ),
      prisma.revenueEvent
        .groupBy({
          by: ["clientId"],
          _sum: { amount: true },
          where: {
            clientId: { in: clientIds },
            createdAt: { gte: oneWeekAgo },
          },
        })
        .then(
          (rows) =>
            new Map(rows.map((r) => [r.clientId, r._sum.amount || 0])),
        ),
      prisma.revenueEvent
        .groupBy({
          by: ["clientId"],
          _sum: { amount: true },
          where: {
            clientId: { in: clientIds },
            createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
          },
        })
        .then(
          (rows) =>
            new Map(rows.map((r) => [r.clientId, r._sum.amount || 0])),
        ),
      prisma.reviewCampaign
        .groupBy({
          by: ["clientId"],
          _count: { id: true },
          where: {
            clientId: { in: clientIds },
            completedAt: { gte: oneWeekAgo },
          },
        })
        .then(
          (rows) => new Map(rows.map((r) => [r.clientId, r._count.id])),
        ),
      // Top lead source per client (most common source value this week)
      prisma.lead.groupBy({
        by: ["clientId", "source"],
        _count: { id: true },
        where: {
          clientId: { in: clientIds },
          createdAt: { gte: oneWeekAgo },
        },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // Build a map of clientId -> top source name
    const topSourceMap = new Map<string, string>();
    for (const row of topSourceRows) {
      if (!topSourceMap.has(row.clientId) && row.source) {
        topSourceMap.set(row.clientId, row.source);
      }
    }

    let sent = 0;
    let skippedDedup = 0;
    const errors: string[] = [];

    for (const client of clients) {
      try {
        const resourceId = `${client.id}_${weekStart}`;

        // Dedup: skip if we already sent this week's report
        const alreadySent = await prisma.auditLog.findFirst({
          where: {
            action: "weekly_report_sent",
            resource: "weekly_report",
            resourceId,
          },
        });
        if (alreadySent) {
          skippedDedup++;
          continue;
        }

        const metrics: WeeklyReportMetrics = {
          leadsThisWeek: leadsThisWeek.get(client.id) || 0,
          leadsLastWeek: leadsLastWeek.get(client.id) || 0,
          bookingsThisWeek: bookingsThisWeek.get(client.id) || 0,
          bookingsLastWeek: bookingsLastWeek.get(client.id) || 0,
          revenueThisWeek: Math.round(
            (revenueThisWeek.get(client.id) || 0) / 100,
          ),
          revenueLastWeek: Math.round(
            (revenueLastWeek.get(client.id) || 0) / 100,
          ),
          topSource: topSourceMap.get(client.id) || "Direct",
          reviewsCollected: reviewsThisWeek.get(client.id) || 0,
        };

        const { subject, html } = buildWeeklyReportEmail(
          client.ownerName,
          client.businessName,
          metrics,
        );

        await sendEmailQueued(client.account.email, subject, html);

        await logAudit({
          accountId: client.account.id,
          action: "weekly_report_sent",
          resource: "weekly_report",
          resourceId,
          metadata: {
            leadsThisWeek: metrics.leadsThisWeek,
            bookingsThisWeek: metrics.bookingsThisWeek,
            revenueThisWeek: metrics.revenueThisWeek,
            topSource: metrics.topSource,
            reviewsCollected: metrics.reviewsCollected,
            recipientEmail: client.account.email,
          },
        });

        sent++;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown error";
        errors.push(`Failed for ${client.id}: ${msg}`);
        logger.error(
          `[cron/weekly-report] Error sending to ${client.id}`,
          { error: msg },
        );
      }
    }

    logger.info("[cron/weekly-report] Completed", {
      sent,
      total: clients.length,
      skippedDedup,
      errors: errors.length,
    });

    return NextResponse.json({
      success: true,
      sent,
      total: clients.length,
      skippedDedup,
      errors: errors.length > 0 ? errors : undefined,
    });
  },
);
