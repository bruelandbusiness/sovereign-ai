import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — Returns financing applications for the authenticated client (paginated)
//        with KPI aggregations.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { clientId } = await requireClient();

    const url = request.nextUrl;
    const statusFilter = url.searchParams.get("status");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)),
      100
    );
    const offset = (page - 1) * limit;

    // Build where clause
    interface AppWhere {
      clientId: string;
      status?: string;
    }
    const where: AppWhere = { clientId };
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Fetch applications + total count + KPI aggregations in parallel
    const [applications, total, allApps] = await Promise.all([
      prisma.financingApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.financingApplication.count({ where }),
      // For KPIs we need data across all statuses for this client
      prisma.financingApplication.findMany({
        where: { clientId },
        select: {
          amount: true,
          status: true,
        },
        take: 100,
      }),
    ]);

    // Calculate KPIs
    const totalApplications = allApps.length;
    const fundedApps = allApps.filter((a) => a.status === "funded");
    const approvedOrFunded = allApps.filter(
      (a) => a.status === "approved" || a.status === "funded"
    );
    const fundedAmount = fundedApps.reduce((sum, a) => sum + a.amount, 0);
    const conversionRate =
      totalApplications > 0
        ? Math.round((approvedOrFunded.length / totalApplications) * 100)
        : 0;
    const avgLoanAmount =
      totalApplications > 0
        ? Math.round(
            allApps.reduce((sum, a) => sum + a.amount, 0) / totalApplications
          )
        : 0;

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        customerName: app.customerName,
        customerEmail: app.customerEmail,
        customerPhone: app.customerPhone,
        amount: app.amount,
        term: app.term,
        apr: app.apr,
        monthlyPayment: app.monthlyPayment,
        status: app.status,
        externalId: app.externalId,
        prequalAmount: app.prequalAmount,
        createdAt: app.createdAt.toISOString(),
      })),
      kpis: {
        totalApplications,
        fundedAmount,
        conversionRate,
        avgLoanAmount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[financing] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch financing data" },
      { status: 500 }
    );
  }
}
