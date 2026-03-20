import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  try {
    // Aggregate customer LTV stats
    const [customers, reminders, campaigns] = await Promise.all([
      prisma.customerLifetimeValue.findMany({
        where: { clientId },
        select: {
          totalRevenue: true,
          predictedLTV: true,
          totalJobs: true,
          segment: true,
          churnRisk: true,
        },
        take: 1000,
      }),
      prisma.serviceReminder.findMany({
        where: { clientId },
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          serviceType: true,
          nextDueDate: true,
          status: true,
          frequency: true,
          revenue: true,
        },
        take: 500,
      }),
      prisma.seasonalCampaign.findMany({
        where: { clientId },
        select: {
          isActive: true,
          totalSent: true,
          totalBooked: true,
          totalRevenue: true,
        },
        take: 100,
      }),
    ]);

    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgRevenuePerCustomer =
      totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
    const totalPredictedLTV = customers.reduce(
      (sum, c) => sum + c.predictedLTV,
      0
    );

    // Repeat rate: customers with more than 1 job
    const repeatCustomers = customers.filter((c) => c.totalJobs > 1).length;
    const repeatRate =
      totalCustomers > 0
        ? Math.round((repeatCustomers / totalCustomers) * 100)
        : 0;

    // Segment counts
    const segments = {
      active: customers.filter((c) => c.segment === "active").length,
      at_risk: customers.filter((c) => c.segment === "at_risk").length,
      dormant: customers.filter((c) => c.segment === "dormant").length,
      lost: customers.filter((c) => c.segment === "lost").length,
    };

    // Segment revenue
    const segmentRevenue = {
      active: customers
        .filter((c) => c.segment === "active")
        .reduce((sum, c) => sum + c.totalRevenue, 0),
      at_risk: customers
        .filter((c) => c.segment === "at_risk")
        .reduce((sum, c) => sum + c.totalRevenue, 0),
      dormant: customers
        .filter((c) => c.segment === "dormant")
        .reduce((sum, c) => sum + c.totalRevenue, 0),
      lost: customers
        .filter((c) => c.segment === "lost")
        .reduce((sum, c) => sum + c.totalRevenue, 0),
    };

    // At-risk customers
    const atRiskCustomers = customers.filter(
      (c) => c.churnRisk === "high" || c.segment === "at_risk"
    ).length;

    // Upcoming reminders (next 30 days)
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingReminders = reminders
      .filter(
        (r) =>
          r.nextDueDate >= now &&
          r.nextDueDate <= thirtyDaysOut &&
          (r.status === "pending" || r.status === "sent")
      )
      .sort(
        (a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime()
      )
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        serviceType: r.serviceType,
        nextDueDate: r.nextDueDate.toISOString(),
        status: r.status,
        frequency: r.frequency,
      }));

    // Reminder stats
    const reminderStats = {
      total: reminders.length,
      pending: reminders.filter((r) => r.status === "pending").length,
      sent: reminders.filter((r) => r.status === "sent").length,
      booked: reminders.filter((r) => r.status === "booked").length,
      completed: reminders.filter((r) => r.status === "completed").length,
      totalRevenue: reminders.reduce((sum, r) => sum + (r.revenue || 0), 0),
    };

    // Campaign stats
    const activeCampaigns = campaigns.filter((c) => c.isActive);
    const campaignStats = {
      total: campaigns.length,
      active: activeCampaigns.length,
      totalSent: campaigns.reduce((sum, c) => sum + c.totalSent, 0),
      totalBooked: campaigns.reduce((sum, c) => sum + c.totalBooked, 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.totalRevenue, 0),
    };

    return NextResponse.json({
      totalCustomers,
      totalRevenue,
      avgRevenuePerCustomer,
      totalPredictedLTV,
      repeatRate,
      atRiskCustomers,
      segments,
      segmentRevenue,
      upcomingReminders,
      reminderStats,
      campaignStats,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load LTV overview" },
      { status: 500 }
    );
  }
}
