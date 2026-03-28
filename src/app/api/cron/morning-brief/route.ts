import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";
import { formatMorningBrief } from "@/lib/operations/digest-generator";
import { isConfigured, sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withCronErrorHandler("cron/morning-brief", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    logger.info("[cron/morning-brief] Starting morning brief generation");

    if (!isConfigured()) {
      logger.warn("[cron/morning-brief] TELEGRAM_BOT_TOKEN not set - skipping");
      return NextResponse.json({ skipped: true, reason: "not configured" });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Count pending approvals
    // 2. Check for critical alerts (anomalies + failed agent executions)
    // 3. Determine system health
    const [pendingApprovals, criticalAnomalies, failedExecutions] =
      await Promise.all([
        prisma.approvalRequest.count({
          where: { status: "pending" },
        }),
        prisma.anomalyLog.findMany({
          where: {
            severity: "critical",
            acknowledged: false,
            createdAt: { gte: twentyFourHoursAgo },
          },
          select: { title: true },
        }),
        prisma.agentExecution.count({
          where: {
            status: "failed",
            createdAt: { gte: twentyFourHoursAgo },
          },
        }),
      ]);

    // Build critical alerts list
    const criticalAlerts: string[] = criticalAnomalies.map((a) => a.title);
    if (failedExecutions > 0) {
      criticalAlerts.push(
        `${failedExecutions} agent execution${failedExecutions === 1 ? "" : "s"} failed in last 24h`,
      );
    }

    // Determine system status based on alerts
    let systemStatus: "green" | "yellow" | "red" = "green";
    if (criticalAlerts.length > 0) {
      systemStatus = "red";
    } else if (failedExecutions > 0) {
      systemStatus = "yellow";
    }

    // 4. Format with formatMorningBrief()
    const message = formatMorningBrief(
      criticalAlerts,
      pendingApprovals,
      systemStatus,
    );

    // 5. Send via Telegram to all active configs with dailyDigest enabled
    const configs = await prisma.telegramConfig.findMany({
      where: { isActive: true, dailyDigest: true },
    });

    let sent = 0;
    for (const config of configs) {
      const ok = await sendTelegramMessage(config.chatId, message);
      if (ok) sent++;
    }

    logger.info("[cron/morning-brief] Morning brief sent", {
      sent,
      total: configs.length,
      pendingApprovals,
      criticalAlerts: criticalAlerts.length,
      systemStatus,
    });

    return NextResponse.json({
      ok: true,
      sent: sent > 0,
      timestamp: new Date().toISOString(),
      pendingApprovals,
      criticalAlerts: criticalAlerts.length,
      systemStatus,
    });
  } catch (err) {
    logger.errorWithCause("[cron/morning-brief] Fatal error", err);
    return NextResponse.json(
      { error: "Morning brief cron job failed" },
      { status: 500 },
    );
  }
});
