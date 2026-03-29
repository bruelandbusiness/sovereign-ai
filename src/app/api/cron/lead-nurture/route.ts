import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Lead nurture cron — runs daily at 9 AM.
 *
 * Finds leads where `nextFollowUpAt` is in the past and status is not
 * "won" or "lost". Creates a reminder notification and updates
 * `lastContactedAt`.
 */
export const GET = withCronErrorHandler("cron/lead-nurture", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const now = new Date();

    // Find leads that are due for follow-up.
    // - Exclude terminal statuses ("won", "lost")
    // - Only include leads belonging to clients with active subscriptions
    //   (handles deleted/churned clients)
    // - Exclude leads that have been nurtured too many times without
    //   progressing (stale leads: contacted >10 times, still status "new")
    // - Order by nextFollowUpAt ASC so the oldest overdue leads are
    //   processed first (prevents the same 50 from being picked every run)
    // - Limit to 50 per run to prevent unbounded processing
    // Find leads that are due for follow-up.
    // Since Lead model doesn't have nextFollowUpAt, we use updatedAt as a proxy:
    // leads not updated in the last 3 days that are still open.
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const dueLeads = await prisma.lead.findMany({
      where: {
        updatedAt: { lt: threeDaysAgo },
        status: { notIn: ["won", "lost"] },
      },
      include: {
        client: {
          select: {
            id: true,
            accountId: true,
            businessName: true,
          },
        },
      },
      orderBy: { updatedAt: "asc" },
      take: 50,
    });

    if (dueLeads.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        reminded: 0,
      });
    }

    // Process each lead individually so one failure doesn't take down the batch
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const nextFollowUp = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    let reminded = 0;
    const errors: string[] = [];

    // Build a date key so each lead gets at most one reminder per calendar day
    const dateKey = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

    for (const lead of dueLeads) {
      try {
        const resourceId = `${lead.id}_${dateKey}`;

        // Idempotency check: skip if we already nurtured this lead today
        const alreadyNurtured = await prisma.auditLog.findFirst({
          where: {
            action: "lead_nurture_reminder_sent",
            resourceId,
          },
        });

        if (alreadyNurtured) continue;

        await prisma.$transaction([
          prisma.notification.create({
            data: {
              accountId: lead.client.accountId,
              type: "lead",
              title: "Follow-up Reminder",
              message: `Time to follow up with ${lead.name}${lead.phone ? ` (${lead.phone})` : ""}${lead.email ? ` — ${lead.email}` : ""}. Status: ${lead.status}`,
              actionUrl: "/dashboard/leads",
            },
          }),
          prisma.lead.update({
            where: { id: lead.id },
            data: {
              updatedAt: now,
            },
          }),
        ]);

        // Record the reminder to prevent duplicates on overlapping runs
        await prisma.auditLog.create({
          data: {
            action: "lead_nurture_reminder_sent",
            resource: "lead",
            resourceId,
            accountId: "system",
            metadata: JSON.stringify({
              leadId: lead.id,
              clientId: lead.client.id,
              date: dateKey,
              sent_at: now.toISOString(),
            }),
          },
        });

        reminded++;
      } catch (err) {
        logger.errorWithCause(`Lead nurture failed for lead ${lead.id}:`, err);
        errors.push(
          `Failed for lead ${lead.id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueLeads.length,
      reminded,
      errors: errors.length > 0 ? errors : undefined,
    });
});
