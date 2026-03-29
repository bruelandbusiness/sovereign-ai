import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — performance plan details + current billing cycle stats
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const plan = await prisma.performancePlan.findUnique({
      where: { clientId },
      select: {
        id: true,
        isActive: true,
        pricePerLead: true,
        pricePerBooking: true,
        monthlyMinimum: true,
        monthlyCap: true,
        servicesIncluded: true,
        billingCycleStart: true,
        currentLeadCount: true,
        currentBookingCount: true,
        currentCharges: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "No performance plan found" }, { status: 404 });
    }

    // Calculate days remaining in billing cycle
    const cycleStart = new Date(plan.billingCycleStart);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalDays = Math.ceil(
      (cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate effective cost per lead
    const effectiveCostPerLead =
      plan.currentLeadCount > 0
        ? Math.round(plan.currentCharges / plan.currentLeadCount)
        : 0;

    // Get previous cycle stats for month-over-month comparison
    const prevCycleStart = new Date(cycleStart);
    prevCycleStart.setMonth(prevCycleStart.getMonth() - 1);

    // Use count + aggregate to avoid loading all events into memory
    const [prevLeadCount, prevBookingCount, prevChargesAgg] = await Promise.all([
      prisma.performanceEvent.count({
        where: {
          clientId,
          planId: plan.id,
          type: "qualified_lead",
          createdAt: { gte: prevCycleStart, lt: cycleStart },
        },
      }),
      prisma.performanceEvent.count({
        where: {
          clientId,
          planId: plan.id,
          type: "booked_appointment",
          createdAt: { gte: prevCycleStart, lt: cycleStart },
        },
      }),
      prisma.performanceEvent.aggregate({
        where: {
          clientId,
          planId: plan.id,
          createdAt: { gte: prevCycleStart, lt: cycleStart },
        },
        _sum: { amount: true },
      }),
    ]);

    const prevLeads = prevLeadCount;
    const prevBookings = prevBookingCount;
    const prevCharges = prevChargesAgg._sum.amount || 0;

    const response = NextResponse.json({
      plan: {
        id: plan.id,
        isActive: plan.isActive,
        pricePerLead: plan.pricePerLead,
        pricePerBooking: plan.pricePerBooking,
        monthlyMinimum: plan.monthlyMinimum,
        monthlyCap: plan.monthlyCap,
        servicesIncluded: plan.servicesIncluded,
        billingCycleStart: plan.billingCycleStart.toISOString(),
      },
      currentCycle: {
        leadCount: plan.currentLeadCount,
        bookingCount: plan.currentBookingCount,
        totalCharges: plan.currentCharges,
        effectiveCharges: Math.max(plan.currentCharges, plan.monthlyMinimum),
        effectiveCostPerLead,
        daysRemaining,
        totalDays,
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
      },
      previousCycle: {
        leadCount: prevLeads,
        bookingCount: prevBookings,
        totalCharges: prevCharges,
      },
    });

    response.headers.set("Cache-Control", "private, max-age=120, stale-while-revalidate=60");

    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    Sentry.captureException(error);
    logger.errorWithCause("[performance] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}
