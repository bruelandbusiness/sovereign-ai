import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// GET — Monthly performance plan billing
//
// Runs on the 1st of each month. For each active PerformancePlan:
//   1. Calculate total charges (max of currentCharges vs monthlyMinimum)
//   2. Create an invoice record
//   3. Mark all uninvoiced events as invoiced
//   4. Reset plan counters for the new cycle
//   5. Update billingCycleStart
//
// Uses cursor-based pagination to process ALL active plans, not just the
// first N. This prevents silent revenue loss when plans exceed a page size.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

export const GET = withCronMonitoring("cron/performance-billing", async (_request) => {

  // Idempotency: compute start of current month to detect duplicate runs
  const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let processed = 0;
    let skippedDuplicate = 0;
    let totalPlans = 0;
    const errors: string[] = [];
    let cursor: string | undefined;

    // Process all active plans using cursor-based pagination
    while (true) {
      const activePlans = await prisma.performancePlan.findMany({
        where: { isActive: true },
        include: {
          client: {
            select: {
              businessName: true,
              accountId: true,
            },
          },
        },
        take: PAGE_SIZE,
        ...(cursor
          ? { skip: 1, cursor: { id: cursor } }
          : {}),
        orderBy: { id: "asc" },
      });

      if (activePlans.length === 0) break;

      totalPlans += activePlans.length;
      cursor = activePlans[activePlans.length - 1].id;

      // Batch-fetch existing performance invoices this month for this page
      // of plan clients to avoid N+1 queries inside the loop
      const planClientIds = activePlans.map((p) => p.clientId);
      const existingInvoices = await prisma.invoice.findMany({
        where: {
          clientId: { in: planClientIds },
          createdAt: { gte: startOfMonth },
          description: { contains: "Performance Plan" },
        },
        select: { clientId: true, id: true },
      });
      const alreadyBilledClients = new Map(
        existingInvoices.map((inv) => [inv.clientId, inv.id])
      );

      for (const plan of activePlans) {
        try {
          // Check if we already billed this plan for this period
          const existingInvoiceId = alreadyBilledClients.get(plan.clientId);
          if (existingInvoiceId) {
            logger.info(
              `Skipping plan ${plan.id} — already billed this month (invoice ${existingInvoiceId})`
            );
            skippedDuplicate++;
            continue; // Already billed this month
          }

          // Calculate the billable amount: the greater of actual charges or the monthly minimum
          const billableAmount = Math.max(plan.currentCharges, plan.monthlyMinimum);

          // If there is a cap, clamp billable to the cap
          const finalAmount = plan.monthlyCap
            ? Math.min(billableAmount, plan.monthlyCap)
            : billableAmount;

          // Guard: skip zero-amount invoices (e.g. plan with $0 minimum and no charges)
          if (finalAmount <= 0) {
            logger.warn(`Skipping plan ${plan.id} — computed amount is $0 or negative`, {
              currentCharges: plan.currentCharges,
              monthlyMinimum: plan.monthlyMinimum,
              monthlyCap: plan.monthlyCap,
            });
            continue;
          }

          // Wrap all billing writes in a transaction so they succeed or fail atomically
          await prisma.$transaction(async (tx) => {
            // Create an invoice record for this billing cycle
            await tx.invoice.create({
              data: {
                clientId: plan.clientId,
                customerName: plan.client.businessName,
                customerPhone: "",
                description: `Performance Plan — ${plan.currentLeadCount} leads, ${plan.currentBookingCount} bookings (${new Date(plan.billingCycleStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })})`,
                amount: finalAmount,
                status: "pending",
              },
            });

            // Mark all uninvoiced performance events as invoiced
            await tx.performanceEvent.updateMany({
              where: {
                planId: plan.id,
                invoiced: false,
              },
              data: {
                invoiced: true,
              },
            });

            // Reset counters and advance the billing cycle
            await tx.performancePlan.update({
              where: { id: plan.id },
              data: {
                currentLeadCount: 0,
                currentBookingCount: 0,
                currentCharges: 0,
                billingCycleStart: new Date(),
              },
            });

            // Create activity event
            await tx.activityEvent.create({
              data: {
                clientId: plan.clientId,
                type: "lead_captured",
                title: "Performance billing cycle completed",
                description: `Monthly performance invoice of $${(finalAmount / 100).toFixed(2)} created (${plan.currentLeadCount} leads, ${plan.currentBookingCount} bookings).`,
              },
            });

            // Create notification
            await tx.notification.create({
              data: {
                accountId: plan.client.accountId,
                type: "billing",
                title: "Performance Plan Invoice",
                message: `Your monthly performance invoice of $${(finalAmount / 100).toFixed(2)} is ready. ${plan.currentLeadCount} leads and ${plan.currentBookingCount} bookings this cycle.`,
                actionUrl: "/dashboard/billing",
              },
            });
          });

          processed++;
        } catch (err) {
          const message = `Failed to process billing for plan ${plan.id}: ${
            err instanceof Error ? err.message : "Unknown error"
          }`;
          logger.error(message);
          errors.push(message);
        }
      }

      // If we got fewer than PAGE_SIZE, we've reached the end
      if (activePlans.length < PAGE_SIZE) break;
    }

    if (totalPlans === 0) {
      return NextResponse.json({
        processed: 0,
        message: "No active performance plans",
      });
    }

    return NextResponse.json({
      success: true,
      processed,
      skippedDuplicate,
      total: totalPlans,
      errors: errors.length > 0 ? errors : undefined,
    });
});
