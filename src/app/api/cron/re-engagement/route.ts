import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { buildReEngagementEmail } from "@/lib/emails/re-engagement";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Re-engagement windows: step, days of inactivity, tolerance in days.
 * A 1-day tolerance ensures clients are only matched once per window.
 */
const RE_ENGAGEMENT_STEPS = [
  { step: 1 as const, days: 14, label: "14d" },
  { step: 2 as const, days: 30, label: "30d" },
] as const;

/** Tolerance: 1 day window so the daily cron catches each client once. */
const WINDOW_MS = 24 * 60 * 60 * 1000;

export const GET = withCronErrorHandler(
  "cron/re-engagement",
  async (request) => {
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;

    const now = Date.now();
    let totalSent = 0;
    const errors: string[] = [];

    for (const { step, days, label } of RE_ENGAGEMENT_STEPS) {
      try {
        const targetMs = days * 24 * 60 * 60 * 1000;
        const inactiveBefore = new Date(now - targetMs);
        const inactiveAfter = new Date(now - targetMs - WINDOW_MS);

        // Find accounts whose most recent session lastUsedAt falls
        // within the inactivity window (between targetDays and
        // targetDays+1 ago), meaning they have been inactive for
        // approximately `days` days.
        //
        // We look for sessions that were last used in the window,
        // ensuring no MORE RECENT session exists for the same account.
        const candidates = await prisma.session.findMany({
          where: {
            lastUsedAt: {
              gte: inactiveAfter,
              lte: inactiveBefore,
            },
          },
          select: {
            accountId: true,
          },
          distinct: ["accountId"],
          take: 500,
        });

        const accountIds = candidates.map((c) => c.accountId);
        if (accountIds.length === 0) continue;

        // Exclude accounts that have a more recent session (i.e. they
        // logged in again after the window we found)
        const recentSessions = await prisma.session.findMany({
          where: {
            accountId: { in: accountIds },
            lastUsedAt: { gt: inactiveBefore },
          },
          select: { accountId: true },
          distinct: ["accountId"],
        });

        const recentAccountIds = new Set(
          recentSessions.map((s) => s.accountId),
        );
        const inactiveAccountIds = accountIds.filter(
          (id) => !recentAccountIds.has(id),
        );

        if (inactiveAccountIds.length === 0) continue;

        // Fetch client details for inactive accounts
        const clients = await prisma.client.findMany({
          where: {
            accountId: { in: inactiveAccountIds },
          },
          select: {
            id: true,
            ownerName: true,
            businessName: true,
            account: {
              select: { email: true },
            },
          },
        });

        for (const client of clients) {
          try {
            const email = client.account.email;
            const auditAction = `re_engagement_${label}_sent`;
            const resourceId = `${client.id}_${label}`;

            // Check if already sent
            const alreadySent = await prisma.auditLog.findFirst({
              where: {
                action: auditAction,
                resource: "re_engagement",
                resourceId,
              },
            });

            if (alreadySent) continue;

            const { subject, html } = buildReEngagementEmail(
              step,
              client.ownerName || "there",
              client.businessName,
            );

            await sendEmail(email, subject, html);

            // Record the send to prevent duplicates
            await prisma.auditLog.create({
              data: {
                action: auditAction,
                resource: "re_engagement",
                resourceId,
                metadata: JSON.stringify({
                  clientId: client.id,
                  step,
                  sent_at: new Date().toISOString(),
                }),
              },
            });

            totalSent++;
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Unknown";
            errors.push(
              `Step ${step} failed for client ${client.id}: ${message}`,
            );
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown";
        errors.push(`Step ${step} query failed: ${message}`);
      }
    }

    logger.info(
      `[cron/re-engagement] Completed: ${totalSent} emails sent`,
      { sent: totalSent, errors: errors.length },
    );

    return NextResponse.json({
      success: true,
      sent: totalSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  },
);
