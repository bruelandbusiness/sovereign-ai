import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { rateLimit, setRateLimitHeaders } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/data-export
 *
 * GDPR / data-portability endpoint.
 * Exports all user data as a downloadable JSON file.
 * Rate limited to 1 export per hour per account.
 */
export async function GET() {
  try {
    const { clientId, accountId } = await requireClient();

    // Rate limit: 1 export per hour per account
    const rl = await rateLimit(
      `data-export:${accountId}`,
      1,
      1 / 3600, // refill ~0.000278 tokens/sec = 1/hour
    );
    if (!rl.allowed) {
      return setRateLimitHeaders(
        NextResponse.json(
          { error: "Rate limit exceeded. Max 1 data export per hour." },
          { status: 429 },
        ),
        rl,
      );
    }

    // Fetch all user data in parallel using efficient select clauses
    const [
      account,
      leads,
      notifications,
      services,
      invoices,
      referralCodes,
    ] = await Promise.all([
      prisma.account.findUnique({
        where: { id: accountId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              businessName: true,
              ownerName: true,
              phone: true,
              city: true,
              state: true,
              vertical: true,
              website: true,
              serviceAreaRadius: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.lead.findMany({
        where: { clientId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          status: true,
          score: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.findMany({
        where: { accountId },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          read: true,
          actionUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.clientService.findMany({
        where: { clientId },
        select: {
          id: true,
          serviceId: true,
          status: true,
          activatedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.invoice.findMany({
        where: { clientId },
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.referralCode.findMany({
        where: { clientId },
        select: {
          id: true,
          code: true,
          status: true,
          creditCents: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Create an audit log entry for the export
    await prisma.auditLog.create({
      data: {
        accountId,
        action: "data_export",
        resource: "account",
        resourceId: accountId,
        metadata: JSON.stringify({
          clientId,
          exportedAt: new Date().toISOString(),
        }),
      },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      account,
      leads,
      notifications,
      services,
      invoices,
      referrals: referralCodes,
    };

    const jsonPayload = JSON.stringify(exportData, null, 2);
    const filename = `data-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(jsonPayload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    Sentry.captureException(error);
    logger.errorWithCause("[data-export] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
