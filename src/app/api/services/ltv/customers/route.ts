import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;
  const { searchParams } = new URL(request.url);
  const segment = searchParams.get("segment");
  const churnRisk = searchParams.get("churnRisk");

  const where: Record<string, unknown> = { clientId };
  if (segment) where.segment = segment;
  if (churnRisk) where.churnRisk = churnRisk;

  const customers = await prisma.customerLifetimeValue.findMany({
    where,
    orderBy: { totalRevenue: "desc" },
    take: 100,
  });

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      customerEmail: c.customerEmail,
      customerName: c.customerName,
      totalJobs: c.totalJobs,
      totalRevenue: c.totalRevenue,
      avgJobValue: c.avgJobValue,
      firstJobDate: c.firstJobDate?.toISOString() || null,
      lastJobDate: c.lastJobDate?.toISOString() || null,
      predictedLTV: c.predictedLTV,
      churnRisk: c.churnRisk,
      segment: c.segment,
      createdAt: c.createdAt.toISOString(),
    }))
  );
  } catch (error) {
    logger.error("GET /api/services/ltv/customers failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
