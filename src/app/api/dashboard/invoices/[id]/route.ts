import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { sendSms } from "@/lib/twilio";

// ---------------------------------------------------------------------------
// GET — single invoice detail
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, clientId },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: invoice.id,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    customerEmail: invoice.customerEmail || "",
    description: invoice.description,
    amount: invoice.amount,
    status: invoice.status,
    stripePaymentLinkUrl: invoice.stripePaymentLinkUrl || null,
    paidAt: invoice.paidAt?.toISOString() || null,
    sentAt: invoice.sentAt?.toISOString() || null,
    createdAt: invoice.createdAt.toISOString(),
  });
}

// ---------------------------------------------------------------------------
// POST — resend SMS for an invoice
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, clientId },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Invoice is already paid" },
      { status: 400 }
    );
  }

  if (invoice.status === "canceled") {
    return NextResponse.json(
      { error: "Invoice has been canceled" },
      { status: 400 }
    );
  }

  // Fetch client for business name
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { businessName: true },
  });

  // Resend SMS (with phone validation and length check)
  if (invoice.stripePaymentLinkUrl) {
    const businessName = client?.businessName || "Our business";
    const amountFormatted = (invoice.amount / 100).toFixed(2);
    const smsResult = await sendSms(
      invoice.customerPhone ?? "",
      `Reminder from ${businessName}: You have an outstanding payment of $${amountFormatted} — ${invoice.description}. Pay here: ${invoice.stripePaymentLinkUrl}`
    );
    if (!smsResult.success) {
      console.error("[invoices] Twilio SMS resend failed:", smsResult.error);
      return NextResponse.json(
        { error: "Failed to send SMS" },
        { status: 500 }
      );
    }
  }

  // Update sentAt
  await prisma.invoice.update({
    where: { id },
    data: { sentAt: new Date(), status: "sent" },
  });

  return NextResponse.json({ success: true, message: "Invoice resent" });
}

// ---------------------------------------------------------------------------
// PATCH — cancel an invoice
// ---------------------------------------------------------------------------

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, clientId },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Cannot cancel a paid invoice" },
      { status: 400 }
    );
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "canceled" },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    message: "Invoice canceled",
  });
}
