import { prisma } from "@/lib/db";

/**
 * Track a qualified lead for performance plan billing.
 *
 * Checks if the client has an active PerformancePlan. If so, creates
 * a PerformanceEvent and updates the plan counters. This is non-blocking
 * and should be called after a lead is created.
 */
export async function trackPerformanceLead(
  clientId: string,
  leadId: string,
  leadName: string
): Promise<void> {
  const plan = await prisma.performancePlan.findUnique({
    where: { clientId },
  });

  if (!plan || !plan.isActive) return;

  // If there is a cap and charges have reached it, skip billing
  if (plan.monthlyCap && plan.currentCharges >= plan.monthlyCap) return;

  // Dedup: check if this lead has already been billed
  const existingEvent = await prisma.performanceEvent.findFirst({
    where: { planId: plan.id, leadId, type: "qualified_lead" },
  });
  if (existingEvent) return;

  const chargeAmount = plan.pricePerLead;

  // Use a transaction to ensure event creation and counter update are atomic
  await prisma.$transaction([
    prisma.performanceEvent.create({
      data: {
        clientId,
        planId: plan.id,
        type: "qualified_lead",
        amount: chargeAmount,
        leadId,
        description: `Qualified lead: ${leadName}`,
      },
    }),
    prisma.performancePlan.update({
      where: { id: plan.id },
      data: {
        currentLeadCount: { increment: 1 },
        currentCharges: { increment: chargeAmount },
      },
    }),
  ]);
}

/**
 * Track a booked appointment for performance plan billing.
 *
 * Similar to trackPerformanceLead but charges the booking rate.
 */
export async function trackPerformanceBooking(
  clientId: string,
  bookingId: string,
  customerName: string
): Promise<void> {
  const plan = await prisma.performancePlan.findUnique({
    where: { clientId },
  });

  if (!plan || !plan.isActive) return;

  // If there is a cap and charges have reached it, skip billing
  if (plan.monthlyCap && plan.currentCharges >= plan.monthlyCap) return;

  // Dedup: check if this booking has already been billed
  const existingEvent = await prisma.performanceEvent.findFirst({
    where: { planId: plan.id, bookingId, type: "booked_appointment" },
  });
  if (existingEvent) return;

  const chargeAmount = plan.pricePerBooking;

  // Use a transaction to ensure event creation and counter update are atomic
  await prisma.$transaction([
    prisma.performanceEvent.create({
      data: {
        clientId,
        planId: plan.id,
        type: "booked_appointment",
        amount: chargeAmount,
        bookingId,
        description: `Booked appointment: ${customerName}`,
      },
    }),
    prisma.performancePlan.update({
      where: { id: plan.id },
      data: {
        currentBookingCount: { increment: 1 },
        currentCharges: { increment: chargeAmount },
      },
    }),
  ]);
}
