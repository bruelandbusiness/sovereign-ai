import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";

// ---------------------------------------------------------------------------
// GET — list quotes with optional status filter and pagination
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const url = request.nextUrl;
  const statusFilter = url.searchParams.get("status");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
  const offset = (page - 1) * limit;

  interface QuoteWhere {
    clientId: string;
    status?: string;
  }

  const where: QuoteWhere = { clientId };
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.quote.count({ where }),
  ]);

  return NextResponse.json({
    quotes: quotes.map((q) => ({
      id: q.id,
      customerName: q.customerName,
      customerPhone: q.customerPhone || "",
      customerEmail: q.customerEmail || "",
      title: q.title,
      description: q.description,
      lineItems: (() => { try { return JSON.parse(q.lineItems || "[]"); } catch { return []; } })(),
      subtotal: q.subtotal,
      tax: q.tax,
      total: q.total,
      status: q.status,
      sentAt: q.sentAt?.toISOString() || null,
      expiresAt: q.expiresAt?.toISOString() || null,
      acceptedAt: q.acceptedAt?.toISOString() || null,
      createdAt: q.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// ---------------------------------------------------------------------------
// POST — create a new quote
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

const createQuoteSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().max(30).optional(),
  customerEmail: z.string().email().optional(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  lineItems: z.array(lineItemSchema).min(1),
  subtotal: z.number().int().min(0),
  tax: z.number().int().min(0).optional(),
  total: z.number().int().min(0),
  leadId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const validation = await validateBody(request, createQuoteSchema);
  if (!validation.success) {
    return validation.response;
  }
  const body = validation.data;

  const quote = await prisma.quote.create({
    data: {
      clientId,
      leadId: body.leadId || null,
      customerName: body.customerName,
      customerPhone: body.customerPhone || null,
      customerEmail: body.customerEmail || null,
      title: body.title,
      description: body.description,
      lineItems: JSON.stringify(body.lineItems),
      subtotal: body.subtotal,
      tax: body.tax || 0,
      total: body.total,
      status: "draft",
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return NextResponse.json(
    {
      id: quote.id,
      customerName: quote.customerName,
      title: quote.title,
      total: quote.total,
      status: quote.status,
      createdAt: quote.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
