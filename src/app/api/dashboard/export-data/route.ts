import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { rateLimit, setRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Redact internal system fields from an object.
 * Removes hashed tokens, internal IDs that are not user-facing,
 * and any fields that could leak implementation details.
 */
function redactSystemFields<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const REDACTED_KEYS = new Set([
    "token",
    "hashedToken",
    "shareToken",
    "stripeSubId",
    "stripeCustId",
    "callSid",
    "messageId",
    "ipAddress",
    "userAgent",
  ]);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key)) {
      continue;
    }
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      value instanceof Date === false
    ) {
      result[key] = redactSystemFields(
        value as Record<string, unknown>,
      );
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === "object" && !(item instanceof Date)
          ? redactSystemFields(item as Record<string, unknown>)
          : item,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * POST /api/dashboard/export-data
 *
 * GDPR / data-portability endpoint.
 * Collects all user data and returns it as a downloadable JSON file.
 * Rate limited to 1 export per day per account.
 */
export async function POST() {
  try {
    const { clientId, accountId } = await requireClient();

    // Rate limit: 1 export per day per account
    const rl = await rateLimit(
      `gdpr-export:${accountId}`,
      1,
      1 / 86400, // refill ~0.0000116 tokens/sec = 1/day
    );
    if (!rl.allowed) {
      return setRateLimitHeaders(
        NextResponse.json(
          {
            error:
              "Rate limit exceeded. You can export your data once per day.",
          },
          { status: 429 },
        ),
        rl,
      );
    }

    // Fetch all user data in parallel
    const [
      account,
      client,
      leads,
      invoices,
      quotes,
      activities,
      auditLogs,
      revenueEvents,
      supportTickets,
    ] = await Promise.all([
      prisma.account.findUnique({
        where: { id: accountId },
        select: {
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.client.findUnique({
        where: { id: clientId },
        select: {
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
          subscription: {
            select: {
              bundleId: true,
              status: true,
              monthlyAmount: true,
              currentPeriodEnd: true,
              isTrial: true,
              trialEndsAt: true,
              createdAt: true,
            },
          },
          services: {
            select: {
              serviceId: true,
              status: true,
              activatedAt: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.lead.findMany({
        where: { clientId },
        select: {
          name: true,
          email: true,
          phone: true,
          source: true,
          status: true,
          score: true,
          stage: true,
          value: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: { clientId },
        select: {
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
      prisma.quote.findMany({
        where: { clientId },
        select: {
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          title: true,
          description: true,
          lineItems: true,
          subtotal: true,
          tax: true,
          total: true,
          status: true,
          sentAt: true,
          expiresAt: true,
          acceptedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.activityEvent.findMany({
        where: { clientId },
        select: {
          type: true,
          title: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { accountId },
        select: {
          action: true,
          resource: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.revenueEvent.findMany({
        where: { clientId },
        select: {
          channel: true,
          eventType: true,
          amount: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.findMany({
        where: { clientId },
        select: {
          subject: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          messages: {
            select: {
              senderRole: true,
              message: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Log the export action for audit trail
    await prisma.auditLog.create({
      data: {
        accountId,
        action: "gdpr_data_export",
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
      dataSubjectNotice:
        "This file contains all personal data held by Sovereign AI " +
        "for your account, exported in compliance with GDPR Article 20 " +
        "(Right to Data Portability).",
      account: redactSystemFields(
        (account ?? {}) as Record<string, unknown>,
      ),
      clientProfile: redactSystemFields(
        (client ?? {}) as Record<string, unknown>,
      ),
      leads,
      invoices,
      quotes,
      activityLog: activities,
      auditLog: auditLogs,
      revenueEvents,
      supportTickets,
    };

    const jsonPayload = JSON.stringify(exportData, null, 2);
    const filename = `sovereign-ai-data-export-${new Date().toISOString().slice(0, 10)}.json`;

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
    logger.errorWithCause("[export-data] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
