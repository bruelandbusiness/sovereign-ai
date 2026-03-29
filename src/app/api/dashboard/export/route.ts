import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { rateLimit, setRateLimitHeaders } from "@/lib/rate-limit";
import { toCSV } from "@/lib/csv";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { clientId, accountId } = await requireClient();

    // Rate limit: 5 exports per hour per account
    const rl = await rateLimit(
      `csv-export:${accountId}`,
      5,
      5 / 3600, // refill ~0.00139 tokens/sec = 5/hour
    );
    if (!rl.allowed) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Rate limit exceeded. Max 5 exports per hour." },
          { status: 429 },
        ),
        rl
      );
    }

    const type = request.nextUrl.searchParams.get("type");
    const format = request.nextUrl.searchParams.get("format") ?? "json";

    if (format !== "json" && format !== "csv") {
      return NextResponse.json(
        { error: 'Invalid format. Use ?format=json or ?format=csv' },
        { status: 400 },
      );
    }

    /**
     * Return rows as either CSV or JSON depending on the requested format.
     */
    function respond(
      rows: Record<string, unknown>[],
      resource: string,
    ): Response {
      if (format === "csv") {
        const csv = toCSV(rows);
        return new Response(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${resource}-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        });
      }
      return NextResponse.json({ data: rows });
    }

    async function logExport(
      resource: string,
      recordCount: number,
    ): Promise<void> {
      await prisma.auditLog.create({
        data: {
          action: "data_export",
          resource,
          resourceId: `${clientId}:${Date.now()}`,
          accountId,
          metadata: JSON.stringify({
            exportType: format,
            recordCount,
            filters: JSON.stringify({ type: resource }),
          }),
        },
      });
    }

    if (type === "leads") {
      const leads = await prisma.lead.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 1000,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          status: true,
          score: true,
          stage: true,
          value: true,
          createdAt: true,
        },
      });

      const rows = leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        source: lead.source,
        status: lead.status,
        score: lead.score ?? "",
        stage: lead.stage ?? "",
        value: lead.value ?? "",
        createdAt: lead.createdAt.toISOString(),
      }));

      await logExport("leads", leads.length);
      return respond(rows, "leads");
    }

    if (type === "activities") {
      const activities = await prisma.activityEvent.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 1000,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          createdAt: true,
        },
      });

      const rows = activities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
      }));

      await logExport("activities", activities.length);
      return respond(rows, "activities");
    }

    if (type === "invoices") {
      const invoices = await prisma.invoice.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 1000,
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          description: true,
          amount: true,
          status: true,
          paidAt: true,
          sentAt: true,
          createdAt: true,
        },
      });

      const rows = invoices.map((inv) => ({
        id: inv.id,
        customer: inv.customerName,
        email: inv.customerEmail ?? "",
        phone: inv.customerPhone ?? "",
        description: inv.description ?? "",
        amount: (inv.amount / 100).toFixed(2),
        status: inv.status,
        sentAt: inv.sentAt ? inv.sentAt.toISOString() : "",
        paidAt: inv.paidAt ? inv.paidAt.toISOString() : "",
        createdAt: inv.createdAt.toISOString(),
      }));

      await logExport("invoices", invoices.length);
      return respond(rows, "invoices");
    }

    if (type === "performance") {
      const events = await prisma.performanceEvent.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        take: 1000,
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          invoiced: true,
          createdAt: true,
        },
      });

      const rows = events.map((evt) => ({
        id: evt.id,
        type: evt.type,
        description: evt.description ?? "",
        amount: (evt.amount / 100).toFixed(2),
        invoiced: evt.invoiced ? "Yes" : "No",
        createdAt: evt.createdAt.toISOString(),
      }));

      await logExport("performance", events.length);
      return respond(rows, "performance");
    }

    return NextResponse.json(
      { error: 'Invalid type. Use ?type=leads, ?type=activities, ?type=invoices, or ?type=performance' },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    Sentry.captureException(error);
    logger.errorWithCause("[export] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
