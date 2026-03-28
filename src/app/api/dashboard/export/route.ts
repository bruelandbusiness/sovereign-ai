import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { rateLimit, setRateLimitHeaders } from "@/lib/rate-limit";
import { toCSV } from "@/lib/csv";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { clientId, accountId } = await requireClient();

    // Rate limit: 10 exports per hour per account
    const rl = await rateLimit(
      `csv-export:${accountId}`,
      10,
      10 / 3600, // refill ~0.00278 tokens/sec = 10/hour
    );
    if (!rl.allowed) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Rate limit exceeded. Max 10 exports per hour." },
          { status: 429 },
        ),
        rl
      );
    }

    const type = request.nextUrl.searchParams.get("type");

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

      const csv = toCSV(rows);

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
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

      const csv = toCSV(rows);

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="activities-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
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

      const csv = toCSV(rows);

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
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

      const csv = toCSV(rows);

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="performance-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
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
    logger.errorWithCause("[export] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
