import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { buildWelcomeSeriesEmail } from "@/lib/emails/welcome-series";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Drip windows: step, days since signup, tolerance in hours. */
const DRIP_STEPS = [
  { step: 1 as const, days: 0, label: "day0" },
  { step: 2 as const, days: 3, label: "day3" },
  { step: 3 as const, days: 7, label: "day7" },
] as const;

/** Tolerance window: send if client is within +/- 6 hours of the target. */
const WINDOW_MS = 6 * 60 * 60 * 1000;

export const GET = withCronErrorHandler(
  "cron/welcome-drip",
  async (request) => {
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;

    const now = Date.now();
    let totalSent = 0;
    const errors: string[] = [];

    for (const { step, days, label } of DRIP_STEPS) {
      try {
        const targetMs = days * 24 * 60 * 60 * 1000;
        const windowStart = new Date(now - targetMs - WINDOW_MS);
        const windowEnd = new Date(now - targetMs + WINDOW_MS);

        // Find clients created within this step's window
        const clients = await prisma.client.findMany({
          where: {
            createdAt: {
              gte: windowStart,
              lte: windowEnd,
            },
          },
          select: {
            id: true,
            ownerName: true,
            businessName: true,
            account: {
              select: { email: true },
            },
          },
          take: 500,
        });

        for (const client of clients) {
          try {
            const email = client.account.email;
            const auditAction = `welcome_drip_${label}_sent`;
            // Use a composite resourceId to ensure uniqueness per client+step
            const resourceId = `${client.id}_${label}`;

            // Check if already sent via auditLog
            const alreadySent = await prisma.auditLog.findFirst({
              where: {
                action: auditAction,
                resource: "welcome_drip",
                resourceId,
              },
            });

            if (alreadySent) continue;

            const { subject, html } = buildWelcomeSeriesEmail(
              step,
              client.ownerName || "there",
              client.businessName,
            );

            await sendEmail(email, subject, html);

            // Record the send to prevent duplicates
            await prisma.auditLog.create({
              data: {
                action: auditAction,
                resource: "welcome_drip",
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
      `[cron/welcome-drip] Completed: ${totalSent} emails sent`,
      { sent: totalSent, errors: errors.length },
    );

    return NextResponse.json({
      success: true,
      sent: totalSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  },
);
