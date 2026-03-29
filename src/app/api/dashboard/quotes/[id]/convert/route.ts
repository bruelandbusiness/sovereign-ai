import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import {
  requireClient,
  AuthError,
  getErrorMessage,
} from "@/lib/require-client";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST — convert an accepted quote into a draft invoice
// ---------------------------------------------------------------------------

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: 10 conversions per hour per IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "quote-convert", 10);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      ),
      rl,
    );
  }

  let clientId: string;
  let accountId: string;
  try {
    ({ clientId, accountId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return apiError(getErrorMessage(e), status);
  }

  const { id } = await params;

  try {
    // Look up the quote and verify ownership
    const quote = await prisma.quote.findFirst({
      where: { id, clientId },
    });

    if (!quote) {
      return apiError("Quote not found", 404);
    }

    // Only accepted quotes can be converted
    if (quote.status !== "accepted") {
      return apiError(
        `Quote cannot be converted: status is "${quote.status}". Only accepted quotes can be converted to invoices.`,
        400,
      );
    }

    // Parse line items to build invoice description
    let lineItems: LineItem[] = [];
    try {
      lineItems = JSON.parse(quote.lineItems || "[]") as LineItem[];
    } catch {
      lineItems = [];
    }

    const descriptionLines = lineItems.map(
      (item: LineItem) =>
        `${item.description} (x${item.quantity}) — $${(item.total / 100).toFixed(2)}`,
    );
    const invoiceDescription = [
      `Converted from quote: ${quote.title}`,
      ...(quote.description ? [quote.description] : []),
      "",
      "Line items:",
      ...descriptionLines,
      "",
      `Quote ID: ${quote.id}`,
    ].join("\n");

    // Create invoice in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          clientId,
          customerName: quote.customerName,
          customerPhone: quote.customerPhone ?? null,
          customerEmail: quote.customerEmail ?? null,
          description: invoiceDescription,
          amount: quote.total,
          status: "draft",
        },
      });

      return inv;
    });

    // Audit log (outside transaction — non-critical)
    try {
      await logAudit({
        accountId,
        action: "quote_converted_to_invoice",
        resource: "invoice",
        resourceId: invoice.id,
        metadata: {
          quoteId: quote.id,
          quoteTitle: quote.title,
          amount: quote.total,
          customerName: quote.customerName,
        },
      });
    } catch (auditError) {
      logger.errorWithCause(
        "[quotes/convert] Audit log failed:",
        auditError,
      );
    }

    return apiSuccess(
      {
        id: invoice.id,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone ?? "",
        customerEmail: invoice.customerEmail ?? "",
        description: invoice.description,
        amount: invoice.amount,
        status: invoice.status,
        quoteId: quote.id,
        createdAt: invoice.createdAt.toISOString(),
      },
      201,
      rl,
    );
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[quotes/convert] POST failed:", error);
    return apiError("Internal server error", 500);
  }
}
