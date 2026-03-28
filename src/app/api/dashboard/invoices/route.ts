import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { sendSms } from "@/lib/twilio";
import { apiSuccess, apiError, apiPaginated } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET — list invoices with optional status filter and pagination
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return apiError(getErrorMessage(e), status);
  }

  const url = request.nextUrl;
  const statusFilter = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") || "1", 10) || 1;
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "50", 10) || 50,
    100,
  );
  const offset = (page - 1) * limit;

  interface InvoiceWhere {
    clientId: string;
    status?: string;
  }

  const where: InvoiceWhere = { clientId };
  if (statusFilter) {
    where.status = statusFilter;
  }

  try {
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          description: true,
          amount: true,
          status: true,
          stripePaymentLinkUrl: true,
          paidAt: true,
          sentAt: true,
          createdAt: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    const mapped = invoices.map((inv) => ({
      id: inv.id,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      customerEmail: inv.customerEmail || "",
      description: inv.description,
      amount: inv.amount,
      status: inv.status,
      stripePaymentLinkUrl: inv.stripePaymentLinkUrl || null,
      paidAt: inv.paidAt?.toISOString() || null,
      sentAt: inv.sentAt?.toISOString() || null,
      createdAt: inv.createdAt.toISOString(),
    }));

    return apiPaginated(mapped, total, page, limit);
  } catch (error) {
    logger.errorWithCause("[dashboard/invoices] GET failed:", error);
    return apiError("Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// POST — create invoice, generate Stripe Payment Link, send SMS
// ---------------------------------------------------------------------------

const createInvoiceSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(10).max(30),
  customerEmail: z.string().email().optional(),
  description: z.string().min(1).max(1000),
  amount: z.number().int().min(100), // at least $1.00
});

export async function POST(request: Request) {
  assertStripeConfigured();

  let clientId: string;
  let accountId: string;
  try {
    ({ clientId, accountId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return apiError(getErrorMessage(e), status);
  }

  const validation = await validateBody(request, createInvoiceSchema);
  if (!validation.success) {
    return validation.response;
  }
  const body = validation.data;

  try {
    // Fetch client for business name
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { businessName: true },
    });

    // Create Stripe Payment Link
    let stripePaymentLinkId: string | null = null;
    let stripePaymentLinkUrl: string | null = null;

    try {
      const price = await stripe.prices.create({
        currency: "usd",
        unit_amount: body.amount,
        product_data: {
          name: body.description,
          metadata: { clientId },
        },
      });

      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: {
          clientId,
          invoiceType: "text_to_pay",
        },
        after_completion: {
          type: "redirect",
          redirect: {
            url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payments/thank-you`,
          },
        },
      });

      stripePaymentLinkId = paymentLink.id;
      stripePaymentLinkUrl = paymentLink.url;
    } catch (err) {
      logger.errorWithCause(
        "[invoices] Stripe payment link creation failed:",
        err,
      );
      return apiError(
        "Failed to create payment link. Please try again.",
        500,
      );
    }

    // Create the Invoice record along with activity event and notification
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          clientId,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          customerEmail: body.customerEmail || null,
          description: body.description,
          amount: body.amount,
          stripePaymentLinkId,
          stripePaymentLinkUrl,
          status: "sent",
          sentAt: new Date(),
        },
      });

      await tx.activityEvent.create({
        data: {
          clientId,
          type: "lead_captured",
          title: "Invoice sent",
          description: `Payment request of $${(body.amount / 100).toFixed(2)} sent to ${body.customerName} via SMS.`,
        },
      });

      await tx.notification.create({
        data: {
          accountId,
          type: "billing",
          title: "Invoice sent",
          message: `Payment request of $${(body.amount / 100).toFixed(2)} sent to ${body.customerName}.`,
          actionUrl: "/dashboard/invoices",
        },
      });

      return inv;
    });

    // Send SMS with payment link (outside transaction)
    if (stripePaymentLinkUrl) {
      const businessName = client?.businessName || "Our business";
      const amountFormatted = (body.amount / 100).toFixed(2);
      const smsResult = await sendSms(
        body.customerPhone,
        `${businessName}: You have a payment request for $${amountFormatted} — ${body.description}. Pay securely here: ${stripePaymentLinkUrl}`,
      );
      if (!smsResult.success) {
        logger.errorWithCause("[invoices] Twilio SMS failed:", smsResult.error);
      }
    }

    return apiSuccess(
      {
        id: invoice.id,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        customerEmail: invoice.customerEmail || "",
        description: invoice.description,
        amount: invoice.amount,
        status: invoice.status,
        stripePaymentLinkUrl: invoice.stripePaymentLinkUrl,
        sentAt: invoice.sentAt?.toISOString() || null,
        createdAt: invoice.createdAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    logger.errorWithCause("[dashboard/invoices] POST failed:", error);
    return apiError("Internal server error", 500);
  }
}
