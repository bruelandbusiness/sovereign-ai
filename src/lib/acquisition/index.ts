import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { sanitizeForPrompt } from "@/lib/ai-utils";
import { scrapeContractors } from "./prospect-finder";

const AI_MODEL =
  process.env.CLAUDE_ACQUISITION_MODEL || "claude-haiku-4-5-20251001";

// ── Types ───────────────────────────────────────────────────

export interface PainSignal {
  type: string;
  evidence: string;
  score: number;
}

export interface BudgetSignal {
  type: string;
  evidence: string;
}

export interface ProspectInput {
  businessName: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  website?: string;
  vertical?: string;
  city?: string;
  state?: string;
  estimatedRevenue?: number;
  employeeCount?: number;
  reviewCount?: number;
  googleAdsActive?: boolean;
  painSignals?: PainSignal[];
  budgetSignals?: BudgetSignal[];
}

export interface ProspectSearchParams {
  vertical?: string;
  city?: string;
  state?: string;
  minRevenue?: number;
}

// ── Scoring (AGENTS.md weights: Revenue 35%, Pain 30%, Timing 20%, Tech 15%) ──

/**
 * Compute a 0-100 composite score for a prospect.
 *
 * Weights per AGENTS.md acquisition.qualifier:
 *   Revenue signals   35 points
 *   Pain signals      30 points
 *   Timing signals    20 points
 *   Tech readiness    15 points
 */
export function scoreProspect(prospect: ProspectInput): number {
  // --- Revenue signals (max 35) ---
  let revenueScore = 0;

  // review_count (max 10): >50 = 10, >20 = 7, >10 = 4
  const reviewCount = prospect.reviewCount ?? 0;
  if (reviewCount > 50) revenueScore += 10;
  else if (reviewCount > 20) revenueScore += 7;
  else if (reviewCount > 10) revenueScore += 4;

  // google_ads_active (max 8)
  if (prospect.googleAdsActive) revenueScore += 8;

  // team_size_signals (max 7)
  if (prospect.employeeCount && prospect.employeeCount > 5) revenueScore += 7;
  else if (prospect.employeeCount && prospect.employeeCount > 2) revenueScore += 4;

  // service_area_size (max 5)
  const hasMultiCity = prospect.painSignals?.some(
    (s) =>
      s.evidence.toLowerCase().includes("multi") ||
      s.evidence.toLowerCase().includes("locations")
  );
  revenueScore += hasMultiCity ? 5 : 3;

  // premium_branding (max 5)
  if (prospect.website) revenueScore += 5;

  revenueScore = Math.min(revenueScore, 35);

  // --- Pain signals (max 30) ---
  let painScore = 0;

  // slow_response_reviews (max 10)
  const hasSlowResponse = prospect.painSignals?.some(
    (s) =>
      s.type.toLowerCase().includes("slow_response") ||
      s.evidence.toLowerCase().includes("nobody called") ||
      s.evidence.toLowerCase().includes("didn't call back") ||
      s.evidence.toLowerCase().includes("no response")
  );
  if (hasSlowResponse) painScore += 10;

  // no_online_booking (max 8)
  const hasNoBooking = prospect.painSignals?.some(
    (s) =>
      s.type.toLowerCase().includes("no_booking") ||
      s.type.toLowerCase().includes("no_online")
  );
  if (hasNoBooking) painScore += 8;

  // poor_web_presence (max 7)
  if (!prospect.website) painScore += 7;
  else {
    const hasPoorWeb = prospect.painSignals?.some((s) =>
      s.type.toLowerCase().includes("no_website") ||
      s.type.toLowerCase().includes("poor_web")
    );
    if (hasPoorWeb) painScore += 7;
  }

  // negative_review_ratio (max 5)
  const hasNegativeRatio = prospect.painSignals?.some(
    (s) =>
      s.type.toLowerCase().includes("low_rating") ||
      s.type.toLowerCase().includes("negative")
  );
  if (hasNegativeRatio) painScore += 5;

  painScore = Math.min(painScore, 30);

  // --- Timing signals (max 20) ---
  let timingScore = 0;

  // seasonal_ramp (max 8)
  const now = new Date();
  const month = now.getMonth();
  if ((month >= 1 && month <= 3) || (month >= 7 && month <= 9)) {
    timingScore += 8;
  }

  // recent_expansion (max 7)
  const hasExpansion = prospect.painSignals?.some(
    (s) =>
      s.evidence.toLowerCase().includes("expand") ||
      s.evidence.toLowerCase().includes("new location") ||
      s.evidence.toLowerCase().includes("hiring")
  );
  if (hasExpansion) timingScore += 7;

  // competitor_lost (max 5)
  const hasCompetitorLost = prospect.painSignals?.some(
    (s) =>
      s.evidence.toLowerCase().includes("competitor closed") ||
      s.evidence.toLowerCase().includes("competitor struggling")
  );
  if (hasCompetitorLost) timingScore += 5;

  timingScore = Math.min(timingScore, 20);

  // --- Tech readiness (max 15) ---
  let techScore = 0;

  // has_website (max 5)
  if (prospect.website) techScore += 5;

  // uses_crm (max 5)
  const hasCRM = prospect.painSignals?.some((s) =>
    s.type.toLowerCase().includes("crm")
  ) || prospect.budgetSignals?.some((s) =>
    s.type.toLowerCase().includes("crm") ||
    s.type.toLowerCase().includes("servicetitan") ||
    s.type.toLowerCase().includes("jobber")
  );
  if (hasCRM) techScore += 5;

  // social_active (max 5)
  const hasSocialSignal =
    prospect.painSignals?.some((s) =>
      s.type.toLowerCase().includes("social")
    ) ||
    prospect.budgetSignals?.some((s) =>
      s.type.toLowerCase().includes("social")
    );
  if (hasSocialSignal) techScore += 5;

  techScore = Math.min(techScore, 15);

  return revenueScore + painScore + timingScore + techScore;
}

/**
 * Determine prospect status based on score per AGENTS.md thresholds.
 */
export function getProspectStatus(score: number): "enriched" | "maybe" | "skip" {
  if (score >= 60) return "enriched";  // Ready for outreach
  if (score >= 40) return "maybe";     // Revisit next quarter
  return "skip";                        // Don't waste outreach
}

/**
 * Check if prospect qualifies for enterprise/white-glove treatment.
 */
export function isEnterpriseProspect(
  score: number,
  revenueEstimate?: string | null
): boolean {
  return score >= 80 && revenueEstimate === "enterprise";
}

// ── Claude-Powered Prospect Analysis ────────────────────────

const PROSPECT_ANALYZE_PROMPT = `You are a B2B sales intelligence analyst for Sovereign Empire, an AI-powered lead generation company serving home services contractors (HVAC, roofing, plumbing, electrical, pest control, landscaping).

Your job is to analyze a contractor's online presence and determine if they are a good fit as a client. A good fit means:
- They are an established business (not a solo handyman)
- They have revenue signals suggesting they can afford $1,500-6,000/month
- They show pain signals suggesting they need better lead generation
- They are in a market we can serve

Analyze the data provided and return a JSON object with:
{
  "score": 0-100,
  "revenue_estimate": "low/medium/high/enterprise",
  "pain_signals": ["list of specific pain points observed"],
  "budget_signals": ["list of budget indicators"],
  "recommendation": "pursue/maybe/skip",
  "personalization_hooks": ["specific things to reference in outreach"],
  "reasoning": "2-3 sentence explanation"
}

Be specific. Reference actual data points, not vague assessments. If you see a review saying "called three times, nobody answered" — that's a pain signal worth noting by name.`;

export interface ClaudeProspectAnalysis {
  score: number;
  revenue_estimate: "low" | "medium" | "high" | "enterprise";
  pain_signals: string[];
  budget_signals: string[];
  recommendation: "pursue" | "maybe" | "skip";
  personalization_hooks: string[];
  reasoning: string;
}

/**
 * Use Claude to deeply analyze a prospect's online presence and score them.
 * Returns structured analysis with specific pain signals and personalization hooks.
 */
export async function analyzeProspectWithClaude(
  prospectData: Record<string, unknown>
): Promise<ClaudeProspectAnalysis | null> {
  const systemClient = await prisma.client.findFirst({
    select: { id: true },
  });
  if (!systemClient) return null;

  try {
    const response = await guardedAnthropicCall({
      clientId: systemClient.id,
      action: "acquisition.prospect_analyze",
      description: "Analyze prospect for qualification",
      params: {
        model: AI_MODEL,
        max_tokens: 1024,
        system: PROSPECT_ANALYZE_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze this contractor:\n${sanitizeForPrompt(JSON.stringify(prospectData, null, 2), 3000)}`,
          },
        ],
      },
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return JSON.parse(text) as ClaudeProspectAnalysis;
  } catch (err) {
    logger.errorWithCause("[acquisition] Claude prospect analysis failed", err);
    return null;
  }
}

// ── Prospect Discovery Orchestrator ─────────────────────────

/**
 * Find new prospects: scrape, score, deduplicate, and store.
 */
export async function findNewProspects(
  params: ProspectSearchParams
): Promise<ProspectInput[]> {
  logger.info("[acquisition] Starting prospect discovery", {
    vertical: params.vertical,
    city: params.city,
    state: params.state,
  });

  // 1. Scrape potential contractors
  const rawProspects = await scrapeContractors({
    vertical: params.vertical,
    city: params.city,
    state: params.state,
  });

  if (rawProspects.length === 0) {
    logger.info("[acquisition] No prospects found from scraper");
    return [];
  }

  // 2. Filter by minimum revenue if specified
  let prospects = rawProspects;
  if (params.minRevenue) {
    prospects = prospects.filter(
      (p) => !p.estimatedRevenue || p.estimatedRevenue >= params.minRevenue!
    );
  }

  // 3. Score each prospect
  const scored = prospects.map((p) => ({
    ...p,
    score: scoreProspect(p),
  }));

  // 4. Deduplicate against existing prospects by business name
  const businessNames = scored.map((p) => p.businessName);
  const existing = await prisma.prospect.findMany({
    where: { businessName: { in: businessNames } },
    select: { businessName: true },
  });
  const existingNames = new Set(existing.map((e) => e.businessName));

  const newProspects = scored.filter(
    (p) => !existingNames.has(p.businessName)
  );

  if (newProspects.length === 0) {
    logger.info("[acquisition] All prospects already exist in database");
    return [];
  }

  // 5. Store new prospects with AGENTS.md status thresholds
  for (const prospect of newProspects) {
    try {
      const prospectScore = scoreProspect(prospect);
      const status = getProspectStatus(prospectScore);

      await prisma.prospect.create({
        data: {
          businessName: prospect.businessName,
          ownerName: prospect.ownerName,
          email: prospect.email,
          phone: prospect.phone,
          website: prospect.website,
          vertical: prospect.vertical ?? params.vertical,
          city: prospect.city ?? params.city,
          state: prospect.state ?? params.state,
          estimatedRevenue: prospect.estimatedRevenue,
          employeeCount: prospect.employeeCount,
          painSignals: prospect.painSignals
            ? JSON.stringify(prospect.painSignals)
            : null,
          budgetSignals: prospect.budgetSignals
            ? JSON.stringify(prospect.budgetSignals)
            : null,
          score: prospectScore,
          source: "scrape",
          status,
        },
      });
    } catch (err) {
      logger.errorWithCause(
        `[acquisition] Failed to store prospect: ${prospect.businessName}`,
        err
      );
    }
  }

  logger.info("[acquisition] Prospect discovery complete", {
    found: rawProspects.length,
    new: newProspects.length,
  });

  return newProspects;
}
