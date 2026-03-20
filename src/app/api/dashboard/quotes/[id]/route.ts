import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { sendSms } from "@/lib/twilio";

const updateQuoteSchema = z.object({
  status: z.string().max(30).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  subtotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email().max(254).optional(),
  items: z.array(z.object({
    name: z.string().max(200),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })).max(50).optional(),
});

// ---------------------------------------------------------------------------
// GET — single quote detail
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

  const quote = await prisma.quote.findFirst({
    where: { id, clientId },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: quote.id,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone || "",
    customerEmail: quote.customerEmail || "",
    title: quote.title,
    description: quote.description,
    lineItems: (() => { try { return JSON.parse(quote.lineItems || "[]"); } catch { return []; } })(),
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    status: quote.status,
    sentAt: quote.sentAt?.toISOString() || null,
    expiresAt: quote.expiresAt?.toISOString() || null,
    acceptedAt: quote.acceptedAt?.toISOString() || null,
    createdAt: quote.createdAt.toISOString(),
  });
}

// ---------------------------------------------------------------------------
// PATCH — update quote (edit line items, status, etc.)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
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

  const quote = await prisma.quote.findFirst({
    where: { id, clientId },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateQuoteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.items !== undefined) updateData.lineItems = JSON.stringify(body.items);
  if (body.subtotal !== undefined) updateData.subtotal = body.subtotal;
  if (body.tax !== undefined) updateData.tax = body.tax;
  if (body.total !== undefined) updateData.total = body.total;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.customerName !== undefined) updateData.customerName = body.customerName;
  if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
  if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;

  const updated = await prisma.quote.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    total: updated.total,
    message: "Quote updated",
  });
}

// ---------------------------------------------------------------------------
// POST — send quote to customer via SMS/email
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  let accountId: string;
  try {
    ({ clientId, accountId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  const quote = await prisma.quote.findFirst({
    where: { id, clientId },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { businessName: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const quoteUrl = `${appUrl}/quotes/${quote.id}?token=${quote.shareToken}`;
  const businessName = client?.businessName || "Our business";
  const amountFormatted = (quote.total / 100).toFixed(2);

  // Send SMS if phone available (with phone validation and length check)
  if (quote.customerPhone) {
    const smsResult = await sendSms(
      quote.customerPhone,
      `${businessName} sent you a quote for $${amountFormatted} — "${quote.title}". View and accept here: ${quoteUrl}`
    );
    if (!smsResult.success) {
      console.error("[quotes] Twilio SMS failed:", smsResult.error);
    }
  }

  // Update quote status
  await prisma.quote.update({
    where: { id },
    data: {
      status: "sent",
      sentAt: new Date(),
      expiresAt: quote.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Create activity event
  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "lead_captured",
      title: "Quote sent",
      description: `Quote "${quote.title}" for $${amountFormatted} sent to ${quote.customerName}.`,
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      accountId,
      type: "system",
      title: "Quote sent",
      message: `Quote "${quote.title}" for $${amountFormatted} sent to ${quote.customerName}.`,
      actionUrl: "/dashboard/quotes",
    },
  });

  return NextResponse.json({ success: true, message: "Quote sent" });
}
