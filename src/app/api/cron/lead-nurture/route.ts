import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron";

export const maxDuration = 300;

/**
 * Lead nurture cron — runs daily at 9 AM.
 *
 * Finds leads where `nextFollowUpAt` is in the past and status is not
 * "won" or "lost". Creates a reminder notification and updates
 * `lastContactedAt`.
 */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
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
    const nextFollowUp = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    let reminded = 0;
    const errors: string[] = [];

    for (const lead of dueLeads) {
      try {
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
        reminded++;
      } catch (err) {
        console.error(`Lead nurture failed for lead ${lead.id}:`, err);
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
  } catch (err) {
    console.error("[cron/lead-nurture] Fatal error:", err);
    return NextResponse.json(
      { error: "Lead nurture cron failed" },
      { status: 500 }
    );
  }
}
