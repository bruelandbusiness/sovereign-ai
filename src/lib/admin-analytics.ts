import { prisma } from "@/lib/db";

export interface PlatformMetrics {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  churnedClients: number;
  totalLeads: number;
  totalBookings: number;
  totalReviews: number;
  totalRevenue: number;
  mrr: number;
  clientsByPlan: Record<string, number>;
  clientsByVertical: Record<string, number>;
  averageServicesPerClient: number;
  topServices: { serviceId: string; count: number }[];
}

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const [
    totalClients,
    subscriptionsByStatus,
    trialCount,
    totalLeads,
    totalBookings,
    totalReviews,
    paidInvoiceSum,
    mrrAggregate,
    clientsByPlan,
    clientsByVertical,
    serviceCountAggregate,
    topServicesRaw,
  ] = await Promise.all([
    prisma.client.count(),

    prisma.subscription.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.subscription.count({
      where: { isTrial: true, status: "active" },
    }),

    prisma.lead.count(),

    prisma.booking.count(),

    prisma.reviewCampaign.count({
      where: { status: "completed" },
    }),

    prisma.invoice.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),

    prisma.subscription.aggregate({
      where: { status: "active" },
      _sum: { monthlyAmount: true },
    }),

    prisma.subscription.groupBy({
      by: ["bundleId"],
      _count: { id: true },
      where: { status: { in: ["active", "past_due"] } },
    }),

    prisma.client.groupBy({
      by: ["vertical"],
      _count: { id: true },
    }),

    prisma.clientService.aggregate({
      where: { status: "active" },
      _count: { id: true },
    }),

    prisma.clientService.groupBy({
      by: ["serviceId"],
      where: { status: "active" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  const statusCounts = Object.fromEntries(
    subscriptionsByStatus.map((row) => [row.status, row._count.id]),
  );

  const activeClients = (statusCounts["active"] ?? 0) + (statusCounts["past_due"] ?? 0);
  const churnedClients = (statusCounts["canceled"] ?? 0) + (statusCounts["expired"] ?? 0);

  const planMap: Record<string, number> = {};
  for (const row of clientsByPlan) {
    const key = row.bundleId ?? "a_la_carte";
    planMap[key] = row._count.id;
  }

  const verticalMap: Record<string, number> = {};
  for (const row of clientsByVertical) {
    const key = row.vertical ?? "unspecified";
    verticalMap[key] = row._count.id;
  }

  const activeServiceCount = serviceCountAggregate._count.id;
  const averageServicesPerClient =
    totalClients > 0 ? activeServiceCount / totalClients : 0;

  const topServices = topServicesRaw.map((row) => ({
    serviceId: row.serviceId,
    count: row._count.id,
  }));

  return {
    totalClients,
    activeClients,
    trialClients: trialCount,
    churnedClients,
    totalLeads,
    totalBookings,
    totalReviews,
    totalRevenue: (paidInvoiceSum._sum.amount ?? 0) / 100,
    mrr: (mrrAggregate._sum.monthlyAmount ?? 0) / 100,
    clientsByPlan: planMap,
    clientsByVertical: verticalMap,
    averageServicesPerClient: Math.round(averageServicesPerClient * 100) / 100,
    topServices,
  };
}

export async function getGrowthMetrics(months: number = 6): Promise<{
  labels: string[];
  clients: number[];
  revenue: number[];
  leads: number[];
}> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const [newClients, paidInvoices, newLeads] = await Promise.all([
    prisma.client.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    prisma.invoice.findMany({
      where: { status: "paid", paidAt: { gte: startDate } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    }),

    prisma.lead.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const labels: string[] = [];
  const clientCounts: number[] = [];
  const revenueCounts: number[] = [];
  const leadCounts: number[] = [];

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    labels.push(
      monthDate.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
    );

    clientCounts.push(
      newClients.filter((c) => {
        const d = c.createdAt;
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
    );

    const monthRevenue = paidInvoices
      .filter((inv) => {
        const d = inv.paidAt!;
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);
    revenueCounts.push(monthRevenue / 100);

    leadCounts.push(
      newLeads.filter((l) => {
        const d = l.createdAt;
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
    );
  }

  return {
    labels,
    clients: clientCounts,
    revenue: revenueCounts,
    leads: leadCounts,
  };
}
