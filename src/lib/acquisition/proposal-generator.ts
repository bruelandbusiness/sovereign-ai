import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { extractTextContent, sanitizeForPrompt } from "@/lib/ai-utils";
import type { PainSignal } from "./index";

const AI_MODEL =
  process.env.CLAUDE_PROPOSAL_MODEL || "claude-sonnet-4-20250514";

// ── Pricing Constants ───────────────────────────────────────

const PRICING_OPTIONS = [
  {
    bundle: "Starter",
    monthlyAmount: 150000, // $1,500 in cents
    features: [
      "AI-powered website chatbot",
      "Lead capture & CRM",
      "Automated follow-up sequences",
      "Monthly performance report",
    ],
  },
  {
    bundle: "Growth",
    monthlyAmount: 350000, // $3,500 in cents
    features: [
      "Everything in Starter",
      "AI receptionist (phone & text)",
      "Review management & response",
      "SEO content generation",
      "Social media automation",
      "Weekly performance reports",
    ],
  },
  {
    bundle: "Scale",
    monthlyAmount: 600000, // $6,000 in cents
    features: [
      "Everything in Growth",
      "Multi-location support",
      "Ad campaign management",
      "Predictive lead scoring",
      "Custom integrations",
      "Dedicated account manager",
      "Real-time analytics dashboard",
    ],
  },
  {
    bundle: "Enterprise",
    monthlyAmount: 0, // Custom pricing
    features: [
      "Everything in Scale",
      "White-label options",
      "Custom AI model training",
      "Priority API access",
      "SLA guarantees",
      "On-demand strategy sessions",
    ],
  },
];

// ── Proposal Generation ─────────────────────────────────────

/**
 * Generate a custom proposal for a prospect using Claude.
 * Stores the result in the Proposal model.
 *
 * @returns The ID of the created Proposal record.
 */
export async function generateProposal(prospectId: string): Promise<string> {
  logger.info("[proposal-generator] Generating proposal", { prospectId });

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
  });

  if (!prospect) {
    throw new Error(`Prospect not found: ${prospectId}`);
  }

  // Load relevant case studies (same vertical if available, otherwise any published)
  const caseStudies = await prisma.caseStudy.findMany({
    where: {
      isPublished: true,
      ...(prospect.vertical ? { vertical: prospect.vertical } : {}),
    },
    take: 3,
    orderBy: { generatedAt: "desc" },
  });

  // If no vertical-specific case studies, fall back to any published
  const studies =
    caseStudies.length > 0
      ? caseStudies
      : await prisma.caseStudy.findMany({
          where: { isPublished: true },
          take: 3,
          orderBy: { generatedAt: "desc" },
        });

  // Parse pain signals from JSON
  let painSignals: PainSignal[] = [];
  if (prospect.painSignals) {
    try {
      painSignals = JSON.parse(prospect.painSignals) as PainSignal[];
    } catch {
      logger.warn("[proposal-generator] Failed to parse pain signals", {
        prospectId,
      });
    }
  }

  const safeBusinessName = sanitizeForPrompt(prospect.businessName, 200);
  const safeVertical = sanitizeForPrompt(prospect.vertical || "home services", 100);
  const safeLocation = sanitizeForPrompt(
    [prospect.city, prospect.state].filter(Boolean).join(", ") || "",
    200
  );

  const painSection =
    painSignals.length > 0
      ? `\nIdentified Pain Points:\n${painSignals.map((s) => `- ${sanitizeForPrompt(s.type, 100)}: ${sanitizeForPrompt(s.evidence, 300)}`).join("\n")}`
      : "";

  const caseStudySection =
    studies.length > 0
      ? `\nRelevant Success Stories:\n${studies.map((cs) => {
          let metricsStr = "";
          try {
            const m = JSON.parse(cs.metrics) as Record<string, unknown>;
            metricsStr = `Leads: ${m.totalLeads}, Bookings: ${m.totalBookings}, Revenue: $${typeof m.totalRevenue === "number" ? (m.totalRevenue / 100).toLocaleString() : "N/A"}`;
          } catch {
            metricsStr = "Metrics available";
          }
          return `- ${sanitizeForPrompt(cs.title, 200)} (${sanitizeForPrompt(cs.vertical || "general", 50)}): ${metricsStr}`;
        }).join("\n")}`
      : "";

  const pricingSection = PRICING_OPTIONS.map(
    (p) =>
      `${p.bundle}: ${p.monthlyAmount > 0 ? `$${(p.monthlyAmount / 100).toLocaleString()}/mo` : "Custom pricing"}\n  Features: ${p.features.join(", ")}`
  ).join("\n\n");

  const prompt = `Generate a custom proposal for this prospect:

Business: ${safeBusinessName}
Vertical: ${safeVertical}
Location: ${safeLocation || "Not specified"}
${prospect.ownerName ? `Owner: ${sanitizeForPrompt(prospect.ownerName, 100)}` : ""}
${prospect.employeeCount ? `Employees: ${prospect.employeeCount}` : ""}
${prospect.estimatedRevenue ? `Estimated Revenue: $${(prospect.estimatedRevenue / 100).toLocaleString()}` : ""}
${painSection}
${caseStudySection}

Available Pricing Tiers:
${pricingSection}

Create a 1-page proposal that:
1. Opens with something specific about their business situation — not generic
2. Identifies 2-3 specific gaps costing them money (based on pain signals)
3. Shows projected ROI: (average job value for their vertical × projected monthly leads × estimated close rate)
4. Recommends the best pricing tier with clear justification
5. Includes a 30-day pilot option: "Start with a 30-day pilot at [price] — cancel anytime if we don't deliver"
6. Includes relevant metrics from case studies if available
7. Ends with a clear, low-friction CTA (reply to schedule a quick call)

Output as clean HTML with inline styles. Keep it under 500 words. Be direct, confident, no corporate fluff.`;

  // Use the first client in the system for governance (these are platform-level AI calls)
  const systemClient = await prisma.client.findFirst({
    select: { id: true },
  });

  if (!systemClient) {
    throw new Error("No system client found for AI governance");
  }

  const response = await guardedAnthropicCall({
    clientId: systemClient.id,
    action: "acquisition.proposal_generate",
    description: `Generate proposal for prospect ${safeBusinessName}`,
    params: {
      model: AI_MODEL,
      max_tokens: 2000,
      system: `You are generating a custom proposal for a home services contractor considering Sovereign Empire's AI lead generation service.

The proposal should be:
- 1 page maximum (they won't read more)
- Specific to their business (use their company name, location, vertical, service area)
- Include projected ROI based on their market (average job value × projected leads × close rate)
- Include the recommended plan with pricing
- Include a 30-day pilot option to reduce risk
- Include 2-3 relevant metrics from similar clients if available
- Professional but not corporate. Direct, confident, no fluff.

Output as clean HTML that can be converted to PDF. Use inline styles only. No external CSS or JavaScript.`,
      messages: [{ role: "user", content: prompt }],
    },
  });

  const content = extractTextContent(response, "");

  // Determine recommended pricing tier based on prospect signals
  let recommendedBundle = "Growth";
  if (prospect.estimatedRevenue && prospect.estimatedRevenue > 100_000_000) {
    // > $1M revenue
    recommendedBundle = "Scale";
  } else if (
    prospect.employeeCount &&
    prospect.employeeCount > 50
  ) {
    recommendedBundle = "Enterprise";
  } else if (
    !prospect.estimatedRevenue ||
    prospect.estimatedRevenue < 20_000_000
  ) {
    // < $200K revenue
    recommendedBundle = "Starter";
  }

  const recommendedPlan = PRICING_OPTIONS.find(
    (p) => p.bundle === recommendedBundle
  )!;

  const pricingJson = JSON.stringify({
    recommended: recommendedBundle,
    monthlyAmount: recommendedPlan.monthlyAmount,
    features: recommendedPlan.features,
    allTiers: PRICING_OPTIONS.map((p) => ({
      bundle: p.bundle,
      monthlyAmount: p.monthlyAmount,
    })),
  });

  const title = `AI Growth Proposal for ${prospect.businessName}`;

  const proposal = await prisma.proposal.create({
    data: {
      prospectId,
      title,
      content,
      pricing: pricingJson,
      status: "draft",
    },
  });

  logger.info("[proposal-generator] Proposal generated", {
    proposalId: proposal.id,
    prospectId,
    recommendedBundle,
  });

  return proposal.id;
}
