import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { rateLimitByIP } from "@/lib/rate-limit";
import {
  calculateMonthlyPayment,
  formatCentsToDollars,
  createApplication,
} from "@/lib/financing";

// ---------------------------------------------------------------------------
// POST — Public application endpoint for financing
//
// Creates a FinancingApplication record, calculates the monthly payment,
// optionally creates a Wisetack application, and logs an activity event.
// No authentication required — this is a customer-facing endpoint.
// ---------------------------------------------------------------------------

const applySchema = z.object({
  clientId: z.string().min(1),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(30).optional(),
  amount: z.number().int().min(50000).max(2500000), // $500 - $25,000 in cents
  term: z.number().int().refine((val) => [6, 12, 24].includes(val), {
    message: "Term must be 6, 12, or 24 months",
  }),
});

export async function POST(request: Request) {
  // Rate limit: 10 applications per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "financing-apply", 10);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const validation = await validateBody(request, applySchema);
  if (!validation.success) {
    return validation.response;
  }

  const { clientId, customerName, customerEmail, customerPhone, amount, term } =
    validation.data;

  // Verify the client exists
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, businessName: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Determine APR based on term
  const apr = term <= 12 ? 0 : 9.99;

  // Calculate monthly payment
  const monthlyPayment = calculateMonthlyPayment(amount, term, apr);

  // Attempt to create a Wisetack application (gracefully fails if not configured)
  const wisetackApp = await createApplication({
    customerName,
    customerEmail,
    customerPhone,
    amountCents: amount,
  });

  // Create the financing application record
  const application = await prisma.financingApplication.create({
    data: {
      clientId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      amount,
      term,
      apr,
      monthlyPayment,
      status: wisetackApp ? "prequalified" : "pending",
      externalId: wisetackApp?.id || null,
      prequalAmount: wisetackApp?.prequalAmount || null,
    },
  });

  // Create an activity event
  const amountFormatted = formatCentsToDollars(amount);
  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "lead_captured",
      title: "New financing application",
      description: `New financing application: ${amountFormatted} from ${customerName} (${term}mo at ${apr}% APR)`,
    },
  });

  return NextResponse.json(
    {
      success: true,
      applicationId: application.id,
      monthlyPayment: application.monthlyPayment,
      status: application.status,
      externalId: application.externalId,
    },
    { status: 201 }
  );
}
