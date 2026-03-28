import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { extractTextContent, sanitizeForPrompt } from "@/lib/ai-utils";

const AI_MODEL =
  process.env.CLAUDE_ACQUISITION_MODEL || "claude-haiku-4-5-20251001";

// ── Types ───────────────────────────────────────────────────

export interface ClientMetrics {
  totalLeads: number;
  totalBookings: number;
  totalRevenue: number; // cents
  daysActive: number;
  vertical?: string;
}

// ── Metrics Gathering ───────────────────────────────────────

/**
 * Gather performance metrics for a client to use in case study generation.
 */
export async function getClientMetrics(
  clientId: string
): Promise<ClientMetrics> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { vertical: true, createdAt: true },
  });

  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const [leadCount, bookingCount, revenueAgg] = await Promise.all([
    prisma.lead.count({ where: { clientId } }),
    prisma.booking.count({ where: { clientId } }),
    prisma.revenueEvent.aggregate({
      where: { clientId },
      _sum: { amount: true },
    }),
  ]);

  const daysActive = Math.floor(
    (Date.now() - client.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    totalLeads: leadCount,
    totalBookings: bookingCount,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    daysActive,
    vertical: client.vertical ?? undefined,
  };
}

// ── Case Study Generation ───────────────────────────────────

/**
 * Generate a case study for a client using their performance metrics.
 * Stores the result in the CaseStudy model (unpublished by default).
 *
 * @returns The ID of the created CaseStudy record.
 */
export async function generateCaseStudy(clientId: string): Promise<string> {
  logger.info("[proof-engine] Generating case study", { clientId });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, businessName: true, vertical: true, city: true, state: true },
  });

  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  const metrics = await getClientMetrics(clientId);

  const revenueDollars = (metrics.totalRevenue / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const leadsPerMonth =
    metrics.daysActive > 0
      ? Math.round((metrics.totalLeads / metrics.daysActive) * 30)
      : metrics.totalLeads;

  const bookingsPerMonth =
    metrics.daysActive > 0
      ? Math.round((metrics.totalBookings / metrics.daysActive) * 30)
      : metrics.totalBookings;

  const conversionRate =
    metrics.totalLeads > 0
      ? ((metrics.totalBookings / metrics.totalLeads) * 100).toFixed(1)
      : "0";

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home services", 100);
  const safeLocation = sanitizeForPrompt(
    [client.city, client.state].filter(Boolean).join(", ") || "",
    200
  );

  const prompt = `Generate a compelling case study narrative from these business metrics for a ${safeVertical} company${safeLocation ? ` in ${safeLocation}` : ""}.

Business: ${safeBusinessName}
Time Active: ${metrics.daysActive} days
Total Leads Generated: ${metrics.totalLeads} (approx. ${leadsPerMonth}/month)
Total Bookings: ${metrics.totalBookings} (approx. ${bookingsPerMonth}/month)
Lead-to-Booking Conversion Rate: ${conversionRate}%
Total Revenue Attributed: ${revenueDollars}

Write a 300-500 word case study with:
1. A compelling headline
2. The challenge the business faced before
3. The solution implemented (AI-powered lead generation and automation)
4. Specific results with the metrics above
5. A brief testimonial-style quote (attributed to the business owner)

Use a professional, results-focused tone. Format in markdown.`;

  const response = await guardedAnthropicCall({
    clientId,
    action: "acquisition.case_study_generate",
    description: `Generate case study for ${safeBusinessName}`,
    params: {
      model: AI_MODEL,
      max_tokens: 1500,
      system:
        "You are a marketing copywriter. Generate a compelling case study narrative from these business metrics.",
      messages: [{ role: "user", content: prompt }],
    },
  });

  const narrative = extractTextContent(response, "");

  const metricsJson = JSON.stringify({
    totalLeads: metrics.totalLeads,
    totalBookings: metrics.totalBookings,
    totalRevenue: metrics.totalRevenue,
    daysActive: metrics.daysActive,
    leadsPerMonth,
    bookingsPerMonth,
    conversionRate: parseFloat(conversionRate),
  });

  const title = `How ${safeBusinessName} Grew with AI-Powered Lead Generation`;

  const caseStudy = await prisma.caseStudy.create({
    data: {
      clientId,
      title,
      vertical: client.vertical,
      metrics: metricsJson,
      narrative,
      isPublished: false,
    },
  });

  logger.info("[proof-engine] Case study generated", {
    caseStudyId: caseStudy.id,
    clientId,
  });

  return caseStudy.id;
}
