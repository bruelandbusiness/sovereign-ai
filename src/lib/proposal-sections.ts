/**
 * Proposal Section Builder
 *
 * Assembles structured proposal sections for contractor prospects.
 * Complements the HTML proposal template in playbooks/proposal-template.ts
 * by providing granular, data-driven section generation with trade-specific
 * pain points, ROI projections, and implementation timelines.
 *
 * No database calls -- all data is computed from inputs and static benchmarks.
 */

import type { ServiceId, BundleId, VerticalId } from "@/types/services";

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type SectionType =
  | "executive_summary"
  | "problem_statement"
  | "proposed_solution"
  | "pricing_breakdown"
  | "roi_projections"
  | "implementation_timeline"
  | "case_studies"
  | "competitive_advantage"
  | "terms_next_steps"
  | "about_sovereign";

export interface ProposalSection {
  /** Machine-readable section identifier. */
  type: SectionType;
  /** Display title for the section. */
  title: string;
  /** Rendered markdown content for this section. */
  content: string;
  /** Display order (lower = earlier). */
  order: number;
  /** Whether this section is included in the final proposal. */
  included: boolean;
}

export interface ProposalConfig {
  /** Which sections to include (defaults to all if omitted). */
  includedSections?: SectionType[];
  /** Whether to include the pilot pricing option. */
  showPilotOption: boolean;
  /** Whether to include case studies / social proof. */
  showCaseStudies: boolean;
  /** Custom footer text (replaces default). */
  customFooter?: string;
  /** Proposal valid-for duration in days. */
  validForDays: number;
}

export interface ProposalData {
  /** Prospect company name. */
  companyName: string;
  /** Contact person's name. */
  contactName: string;
  /** Trade vertical for the prospect. */
  vertical: VerticalId;
  /** Geographic service area. */
  serviceArea: string;
  /** Selected services for the proposal. */
  selectedServices: ServiceId[];
  /** Selected bundle tier (if any). */
  bundle?: BundleId;
  /** Average job value in dollars. */
  avgJobValue: number;
  /** Monthly price in dollars. */
  monthlyPrice: number;
  /** Setup fee in dollars (0 if waived). */
  setupFee: number;
  /** Pilot price in dollars (discounted first-month rate). */
  pilotPrice: number;
  /** Number of leads included per month. */
  leadsIncluded: number;
  /** Estimated monthly leads to be delivered. */
  projectedLeads: number;
  /** Conservative close rate as a decimal (e.g. 0.15). */
  closeRate: number;
  /** Proposal generation date (ISO string). */
  proposalDate: string;
  /** Configuration for proposal assembly. */
  config: ProposalConfig;
}

// ---------------------------------------------------------------------------
// Section Template Type
// ---------------------------------------------------------------------------

interface SectionTemplate {
  type: SectionType;
  title: string;
  description: string;
  order: number;
  required: boolean;
}

// ---------------------------------------------------------------------------
// SECTION_TEMPLATES Constant
// ---------------------------------------------------------------------------

export const SECTION_TEMPLATES: readonly SectionTemplate[] = [
  {
    type: "executive_summary",
    title: "Executive Summary",
    description:
      "High-level overview of the opportunity and recommended approach.",
    order: 1,
    required: true,
  },
  {
    type: "problem_statement",
    title: "The Challenge",
    description:
      "Trade-specific pain points and market pressures the prospect faces.",
    order: 2,
    required: true,
  },
  {
    type: "proposed_solution",
    title: "Proposed Solution",
    description:
      "Service recommendations tailored to the prospect's vertical and goals.",
    order: 3,
    required: true,
  },
  {
    type: "pricing_breakdown",
    title: "Investment Summary",
    description:
      "Tier comparison table with monthly pricing, setup fees, and inclusions.",
    order: 4,
    required: true,
  },
  {
    type: "roi_projections",
    title: "Projected Return on Investment",
    description:
      "Data-driven ROI projections using industry benchmarks and close rates.",
    order: 5,
    required: true,
  },
  {
    type: "implementation_timeline",
    title: "Implementation Timeline",
    description:
      "Phased rollout plan with milestones, from onboarding to full production.",
    order: 6,
    required: true,
  },
  {
    type: "case_studies",
    title: "Results From Similar Companies",
    description:
      "Social proof from contractors in the same or adjacent verticals.",
    order: 7,
    required: false,
  },
  {
    type: "competitive_advantage",
    title: "Why Sovereign AI",
    description:
      "Key differentiators vs. traditional agencies and other lead-gen platforms.",
    order: 8,
    required: false,
  },
  {
    type: "terms_next_steps",
    title: "Terms & Next Steps",
    description:
      "Proposal validity, contract terms, and clear next actions to get started.",
    order: 9,
    required: true,
  },
  {
    type: "about_sovereign",
    title: "About Sovereign AI",
    description:
      "Company background, mission, and platform capabilities overview.",
    order: 10,
    required: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Trade-Specific Benchmarks (static, no DB)
// ---------------------------------------------------------------------------

interface TradeBenchmark {
  avgJobValue: number;
  closeRate: number;
  responseRate: number;
  leadsPerMonth: number;
  painPoints: string[];
  competitiveThreats: string[];
  seasonalNote: string;
}

const TRADE_BENCHMARKS: Record<string, TradeBenchmark> = {
  hvac: {
    avgJobValue: 2500,
    closeRate: 0.25,
    responseRate: 0.08,
    leadsPerMonth: 35,
    painPoints: [
      "Seasonal demand swings leave crews idle 3-4 months per year",
      "Rising cost-per-click on Google Ads ($40-80/click for HVAC keywords)",
      "Homeowners compare 3-5 quotes before deciding, extending sales cycles",
      "Aging workforce makes it hard to scale even when demand is high",
      "Competitors with bigger ad budgets dominate local search results",
      "No systematic follow-up means 60%+ of estimates never convert",
    ],
    competitiveThreats: [
      "National franchises (One Hour, Comfort Experts) with massive ad spend",
      "Home warranty companies funneling leads to preferred vendors",
      "Online marketplaces (Angi, Thumbtack) commoditizing service pricing",
    ],
    seasonalNote:
      "Peak demand June-August and December-January; " +
      "shoulder months are ideal for pipeline building.",
  },
  plumbing: {
    avgJobValue: 1800,
    closeRate: 0.3,
    responseRate: 0.07,
    leadsPerMonth: 40,
    painPoints: [
      "Emergency calls dominate revenue but are unpredictable and hard to scale",
      "Low average ticket on repairs makes customer acquisition cost critical",
      "Homeowners delay non-emergency plumbing work indefinitely",
      "Review velocity is low because customers only call when something breaks",
      "Difficult to upsell maintenance plans without a structured follow-up system",
      "Competitors undercutting on price erode margins on commodity repairs",
    ],
    competitiveThreats: [
      "Large plumbing chains with 24/7 dispatch and heavy branding",
      "Home service platforms bundling plumbing with other trades",
      "DIY culture fueled by YouTube reducing service call volume",
    ],
    seasonalNote:
      "Winter freeze emergencies and holiday plumbing strain drive peak demand; " +
      "spring and fall are ideal for maintenance plan outreach.",
  },
  roofing: {
    avgJobValue: 5000,
    closeRate: 0.2,
    responseRate: 0.06,
    leadsPerMonth: 25,
    painPoints: [
      "Long sales cycles (2-6 weeks from estimate to signed contract)",
      "Storm-chaser competitors flood the market after weather events",
      "Insurance claim complexity frustrates homeowners and delays projects",
      "High customer acquisition cost ($200-500/lead from paid channels)",
      "Seasonal production windows limit annual revenue capacity",
      "Reputation damage from low-quality subcontractors is hard to recover from",
    ],
    competitiveThreats: [
      "Storm-chasing roofing companies with aggressive door-knocking",
      "Insurance-preferred vendor networks that bypass local roofers",
      "National roofing companies expanding into local markets",
    ],
    seasonalNote:
      "Peak production May-August; winter is planning and booking season. " +
      "Post-storm surges create short-window opportunity spikes.",
  },
  electrical: {
    avgJobValue: 2000,
    closeRate: 0.25,
    responseRate: 0.06,
    leadsPerMonth: 30,
    painPoints: [
      "EV charger demand is surging but most electricians lack marketing for it",
      "Panel upgrade opportunities are missed because homeowners don't know they need one",
      "Permit-heavy work slows project completion and cash flow",
      "Competition from handymen doing unlicensed electrical work",
      "Difficult to communicate urgency for preventive electrical work",
      "Low online visibility compared to HVAC and plumbing competitors",
    ],
    competitiveThreats: [
      "Solar companies bundling electrical panel upgrades into solar deals",
      "National electrical franchises (Mr. Electric) with brand recognition",
      "General contractors absorbing electrical work in-house",
    ],
    seasonalNote:
      "Peak demand June-July; EV charger installs are year-round. " +
      "Holiday lighting season creates Q4 opportunity spikes.",
  },
  landscaping: {
    avgJobValue: 2500,
    closeRate: 0.2,
    responseRate: 0.05,
    leadsPerMonth: 30,
    painPoints: [
      "Extreme seasonality: 60%+ of revenue compressed into 4-5 months",
      "Price-shopping customers make it hard to sell design/build services",
      "Crew retention is difficult during off-season months",
      "Maintenance contracts have thin margins without upsell strategy",
      "Visual portfolio is critical but most landscapers lack professional photos",
      "HOA and commercial accounts require long sales cycles",
    ],
    competitiveThreats: [
      "Low-cost mow-and-blow operators undercutting on maintenance pricing",
      "National lawn care franchises (TruGreen) with subscription models",
      "Hardscape specialists poaching design/build projects",
    ],
    seasonalNote:
      "Peak production May-June; fall renovation (September-October) " +
      "is an underutilized second season for smart operators.",
  },
  "general-contractor": {
    avgJobValue: 8000,
    closeRate: 0.15,
    responseRate: 0.05,
    leadsPerMonth: 20,
    painPoints: [
      "Long project timelines make cash flow management difficult",
      "Reputation is fragile -- one bad review can cost months of pipeline",
      "Subcontractor coordination adds risk and unpredictability",
      "Permit delays and inspection failures slow project completion",
      "Clients expect detailed estimates but comparison-shop heavily",
      "Marketing ROI is hard to track across multi-month project cycles",
    ],
    competitiveThreats: [
      "Design/build firms offering turnkey solutions",
      "Online platforms (Houzz, BuildZoom) aggregating contractor leads",
      "Homeowners acting as their own GC using subcontractor marketplaces",
    ],
    seasonalNote:
      "Spring and fall are peak booking seasons; " +
      "winter is planning/design season with lower competition for attention.",
  },
  other: {
    avgJobValue: 2000,
    closeRate: 0.2,
    responseRate: 0.06,
    leadsPerMonth: 25,
    painPoints: [
      "Inconsistent lead flow makes revenue forecasting unreliable",
      "Reliance on word-of-mouth limits growth beyond existing network",
      "Rising digital ad costs squeeze margins on customer acquisition",
      "No systematic follow-up means lost estimates pile up",
      "Competitors with stronger online presence capture market share",
      "Manual processes (spreadsheets, paper) waste hours every week",
    ],
    competitiveThreats: [
      "Larger competitors with dedicated marketing teams",
      "Lead aggregator platforms that sell the same lead to multiple companies",
      "Franchise operations with standardized marketing playbooks",
    ],
    seasonalNote:
      "Seasonality varies by trade; a consistent pipeline strategy " +
      "smooths revenue across all months.",
  },
};

// ---------------------------------------------------------------------------
// Service Display Names
// ---------------------------------------------------------------------------

const SERVICE_NAMES: Record<ServiceId, string> = {
  "lead-gen": "AI Lead Generation",
  "voice-agent": "AI Voice Agent",
  chatbot: "AI Chatbot",
  seo: "Local SEO",
  ads: "Paid Advertising",
  email: "Email Marketing",
  social: "Social Media Management",
  reviews: "Review Management",
  booking: "Online Booking",
  crm: "CRM Integration",
  website: "Website Design",
  analytics: "Analytics Dashboard",
  content: "Content Marketing",
  reputation: "Reputation Management",
  retargeting: "Retargeting Ads",
  custom: "Custom Solution",
};

// ---------------------------------------------------------------------------
// Bundle Display Names & Pricing
// ---------------------------------------------------------------------------

interface BundleTier {
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  services: ServiceId[];
  leadsIncluded: number;
  setupFee: number;
  pilotPrice: number;
  supportLevel: string;
}

const BUNDLE_TIERS: Record<BundleId, BundleTier> = {
  diy: {
    name: "DIY",
    monthlyPrice: 297,
    annualMonthlyPrice: 247,
    services: ["lead-gen", "analytics"],
    leadsIncluded: 25,
    setupFee: 0,
    pilotPrice: 197,
    supportLevel: "Email support",
  },
  starter: {
    name: "Starter",
    monthlyPrice: 997,
    annualMonthlyPrice: 847,
    services: ["lead-gen", "email", "reviews", "analytics"],
    leadsIncluded: 50,
    setupFee: 500,
    pilotPrice: 697,
    supportLevel: "Email + chat support",
  },
  growth: {
    name: "Growth",
    monthlyPrice: 1997,
    annualMonthlyPrice: 1697,
    services: [
      "lead-gen",
      "voice-agent",
      "email",
      "seo",
      "reviews",
      "booking",
      "analytics",
    ],
    leadsIncluded: 100,
    setupFee: 1000,
    pilotPrice: 1497,
    supportLevel: "Priority support + weekly calls",
  },
  empire: {
    name: "Empire",
    monthlyPrice: 3997,
    annualMonthlyPrice: 3397,
    services: [
      "lead-gen",
      "voice-agent",
      "chatbot",
      "email",
      "seo",
      "ads",
      "social",
      "reviews",
      "booking",
      "crm",
      "analytics",
      "content",
      "reputation",
      "retargeting",
    ],
    leadsIncluded: 250,
    setupFee: 2000,
    pilotPrice: 2997,
    supportLevel: "Dedicated account manager + Slack channel",
  },
};

// ---------------------------------------------------------------------------
// Helper: get benchmark for vertical
// ---------------------------------------------------------------------------

function getBenchmark(vertical: VerticalId): TradeBenchmark {
  return TRADE_BENCHMARKS[vertical] ?? TRADE_BENCHMARKS["other"];
}

// ---------------------------------------------------------------------------
// Section Content Generators
// ---------------------------------------------------------------------------

function buildExecutiveSummary(data: ProposalData): string {
  const benchmark = getBenchmark(data.vertical);
  const projectedJobs = Math.round(
    data.projectedLeads * data.closeRate,
  );
  const projectedRevenue = projectedJobs * data.avgJobValue;

  return [
    `${data.contactName},`,
    "",
    `Thank you for the opportunity to present this proposal for ${data.companyName}. ` +
      `After analyzing your market in **${data.serviceArea}** and the competitive landscape ` +
      `for **${formatVerticalName(data.vertical)}** services, we've identified a significant ` +
      `growth opportunity.`,
    "",
    "**Key projections:**",
    "",
    `- **${data.projectedLeads} qualified leads/month** delivered to your team`,
    `- **${projectedJobs} new jobs/month** at a ${(data.closeRate * 100).toFixed(0)}% close rate`,
    `- **$${projectedRevenue.toLocaleString()} projected monthly revenue** ` +
      `from new customer acquisition`,
    `- **${calculateROIMultiple(projectedRevenue, data.monthlyPrice)}x ROI** ` +
      `on your Sovereign AI investment`,
    "",
    `The typical ${formatVerticalName(data.vertical)} company in your market ` +
      `generates ${benchmark.leadsPerMonth} leads/month through traditional channels. ` +
      `Our AI-powered system is designed to significantly increase that volume while ` +
      `reducing your cost per lead.`,
  ].join("\n");
}

function buildProblemStatement(data: ProposalData): string {
  return generateProblemStatement(data.vertical, data.serviceArea);
}

function buildProposedSolution(data: ProposalData): string {
  const serviceList = data.selectedServices
    .map((id) => {
      const name = SERVICE_NAMES[id];
      return `- **${name}**`;
    })
    .join("\n");

  const bundleNote = data.bundle
    ? `\n\nThese services are bundled in our **${BUNDLE_TIERS[data.bundle].name} Plan**, ` +
      `which is optimized for ${formatVerticalName(data.vertical)} businesses ` +
      `at your growth stage.`
    : "";

  return [
    `Based on the challenges outlined above, we recommend the following ` +
      `service configuration for ${data.companyName}:`,
    "",
    "### Recommended Services",
    "",
    serviceList,
    bundleNote,
    "",
    "### How It Works",
    "",
    "1. **AI-Powered Discovery** -- Our system scans " +
      "building permits, property records, home sales, " +
      "and competitor reviews to identify high-intent prospects",
    "2. **Contact Verification** -- Every lead is verified before " +
      "delivery (email, phone, address validation)",
    "3. **Personalized Outreach** -- Automated, trade-specific " +
      "messaging sequences via email and SMS",
    "4. **Follow-Up Automation** -- Multi-touch follow-up " +
      "sequences ensure no opportunity falls through the cracks",
    "5. **Real-Time Dashboard** -- Track every lead, " +
      "conversation, and conversion in one place",
  ].join("\n");
}

function buildPricingBreakdown(data: ProposalData): string {
  const allTierIds: BundleId[] = ["starter", "growth", "empire"];
  const selectedTier = data.bundle ?? "growth";

  const tierRows = allTierIds
    .map((tierId) => {
      const tier = BUNDLE_TIERS[tierId];
      const isSelected = tierId === selectedTier;
      const marker = isSelected ? " **(Recommended)**" : "";
      return (
        `| ${tier.name}${marker} ` +
        `| $${tier.monthlyPrice.toLocaleString()}/mo ` +
        `| $${tier.annualMonthlyPrice.toLocaleString()}/mo ` +
        `| ${tier.leadsIncluded} ` +
        `| $${tier.setupFee.toLocaleString()} ` +
        `| ${tier.supportLevel} |`
      );
    })
    .join("\n");

  const sections = [
    "### Tier Comparison",
    "",
    "| Plan | Monthly | Annual (per mo) | Leads/Mo | Setup Fee | Support |",
    "|------|---------|-----------------|----------|-----------|---------|",
    tierRows,
  ];

  if (data.config.showPilotOption) {
    sections.push(
      "",
      "### 30-Day Pilot Option",
      "",
      `Try the ${BUNDLE_TIERS[selectedTier].name} plan at a reduced rate of ` +
        `**$${data.pilotPrice.toLocaleString()}/month** for the first 30 days. ` +
        `No long-term commitment required -- see the results before you decide.`,
    );
  }

  sections.push(
    "",
    "### What's Included at Every Tier",
    "",
    "- AI-powered lead discovery from 6+ data sources",
    "- Contact verification before delivery",
    "- Personalized outreach on your behalf",
    "- Automated follow-up sequences",
    "- Real-time dashboard with lead pipeline",
    "- Weekly performance reports",
  );

  return sections.join("\n");
}

function buildROIProjections(data: ProposalData): string {
  return generateROIProjection(
    data.vertical,
    data.projectedLeads,
    data.closeRate,
    data.avgJobValue,
    data.monthlyPrice,
  );
}

function buildImplementationTimeline(data: ProposalData): string {
  return generateTimeline(data.proposalDate, data.selectedServices);
}

function buildCaseStudies(data: ProposalData): string {
  const vertical = data.vertical;
  const studies = getCaseStudiesForVertical(vertical);

  if (studies.length === 0) {
    return "Case studies for your vertical are available upon request.";
  }

  return studies
    .map(
      (study) =>
        `### ${study.company} (${study.trade})\n\n` +
        `> "${study.quote}"\n\n` +
        `**Results:** ${study.result}\n`,
    )
    .join("\n");
}

function buildCompetitiveAdvantage(): string {
  return [
    "### AI-First, Not Agency-First",
    "",
    "Traditional marketing agencies charge $2,000-5,000/month and rely on " +
      "manual processes. Sovereign AI uses machine learning to find, verify, " +
      "and engage prospects at a fraction of the cost.",
    "",
    "| Factor | Traditional Agency | Lead Aggregator | Sovereign AI |",
    "|--------|--------------------|-----------------|--------------|",
    "| Lead exclusivity | Shared | Sold to 3-5 companies | 100% exclusive |",
    "| Lead verification | Manual/inconsistent | None | AI-verified |",
    "| Follow-up | Your responsibility | Your responsibility | Automated |",
    "| Reporting | Monthly PDF | Basic dashboard | Real-time dashboard |",
    "| Contract | 6-12 month lock-in | Pay-per-lead | Month-to-month |",
    "| Setup time | 2-4 weeks | Instant (low quality) | 5-7 business days |",
    "| Personalization | Template-based | None | Trade-specific AI |",
    "",
    "### Platform Capabilities",
    "",
    "- **16 AI systems** working together to find and convert leads",
    "- **500+ contractors** already using the platform",
    "- **$12M+ in attributed revenue** generated for clients",
    "- **97% client retention rate** (industry average: ~70%)",
    "- **4.9/5 average rating** across 487 verified reviews",
  ].join("\n");
}

function buildTermsAndNextSteps(data: ProposalData): string {
  const validUntil = computeValidUntilDate(
    data.proposalDate,
    data.config.validForDays,
  );

  const sections = [
    "### Proposal Terms",
    "",
    `- This proposal is valid until **${validUntil}** ` +
      `(${data.config.validForDays} days from issue date)`,
    "- Month-to-month service -- cancel anytime with 30 days notice",
    "- Setup fee is a one-time charge billed at contract signing",
    "- First month's service fee is billed at onboarding kickoff",
    "- All leads are 100% exclusive to your business",
    "",
    "### Next Steps",
    "",
    "1. **Review this proposal** and note any questions",
    "2. **Schedule a 15-minute call** to finalize service configuration",
    "3. **Sign the service agreement** (sent via DocuSign)",
    "4. **Complete onboarding kickoff** (30-minute guided setup)",
    "5. **Receive your first leads** within 5-7 business days of kickoff",
  ];

  if (data.config.customFooter) {
    sections.push("", "---", "", data.config.customFooter);
  }

  return sections.join("\n");
}

function buildAboutSovereign(): string {
  return [
    "Sovereign AI is an AI-powered growth platform purpose-built for " +
      "home service contractors. We combine proprietary lead discovery " +
      "technology with automated outreach and follow-up to deliver " +
      "a predictable pipeline of qualified prospects.",
    "",
    "**Our mission:** Help every skilled contractor build the business " +
      "they deserve by removing the guesswork from customer acquisition.",
    "",
    "**Founded:** 2024",
    "**Headquarters:** United States",
    "**Clients served:** 500+",
    "**Verticals:** HVAC, Plumbing, Roofing, Electrical, " +
      "Landscaping, Pest Control, General Contracting, and more",
    "",
    "Learn more at [sovereignempire.io](https://sovereignempire.io)",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Public API: generateProblemStatement
// ---------------------------------------------------------------------------

/**
 * Generates a trade-specific pain point analysis for the given vertical.
 *
 * @param vertical - The contractor's trade vertical.
 * @param serviceArea - Geographic service area for localized context.
 * @returns Formatted markdown string with pain points and market analysis.
 */
export function generateProblemStatement(
  vertical: VerticalId,
  serviceArea: string,
): string {
  const benchmark = getBenchmark(vertical);
  const verticalName = formatVerticalName(vertical);

  const painPointsList = benchmark.painPoints
    .map((point) => `- ${point}`)
    .join("\n");

  const threatsList = benchmark.competitiveThreats
    .map((threat) => `- ${threat}`)
    .join("\n");

  return [
    `The **${verticalName}** market in **${serviceArea}** is increasingly competitive. ` +
      `Contractors who rely solely on referrals and word-of-mouth are losing ground ` +
      `to competitors with systematic lead generation strategies.`,
    "",
    "### Pain Points We See Across the Industry",
    "",
    painPointsList,
    "",
    "### Competitive Threats",
    "",
    threatsList,
    "",
    "### Seasonal Dynamics",
    "",
    benchmark.seasonalNote,
    "",
    `The bottom line: **${verticalName} contractors in ${serviceArea}** who don't invest ` +
      `in a predictable lead pipeline risk falling behind competitors who do.`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Public API: generateROIProjection
// ---------------------------------------------------------------------------

/**
 * Projects ROI based on trade benchmarks and the proposed service bundle.
 *
 * @param vertical - The contractor's trade vertical.
 * @param projectedLeads - Number of leads expected per month.
 * @param closeRate - Expected close rate as a decimal (e.g. 0.20).
 * @param avgJobValue - Average revenue per closed job in dollars.
 * @param monthlyInvestment - Monthly service cost in dollars.
 * @returns Formatted markdown string with ROI projections table.
 */
export function generateROIProjection(
  vertical: VerticalId,
  projectedLeads: number,
  closeRate: number,
  avgJobValue: number,
  monthlyInvestment: number,
): string {
  const benchmark = getBenchmark(vertical);
  const verticalName = formatVerticalName(vertical);

  // Conservative scenario: use provided numbers
  const conservativeJobs = Math.round(projectedLeads * closeRate);
  const conservativeRevenue = conservativeJobs * avgJobValue;
  const conservativeROI = calculateROIMultiple(
    conservativeRevenue,
    monthlyInvestment,
  );

  // Moderate scenario: 20% more leads, slightly better close rate
  const moderateLeads = Math.round(projectedLeads * 1.2);
  const moderateCloseRate = Math.min(closeRate * 1.15, 0.5);
  const moderateJobs = Math.round(moderateLeads * moderateCloseRate);
  const moderateRevenue = moderateJobs * avgJobValue;
  const moderateROI = calculateROIMultiple(
    moderateRevenue,
    monthlyInvestment,
  );

  // Aggressive scenario: 50% more leads, benchmark close rate
  const aggressiveLeads = Math.round(projectedLeads * 1.5);
  const aggressiveCloseRate = Math.max(
    benchmark.closeRate,
    closeRate,
  );
  const aggressiveJobs = Math.round(
    aggressiveLeads * aggressiveCloseRate,
  );
  const aggressiveRevenue = aggressiveJobs * avgJobValue;
  const aggressiveROI = calculateROIMultiple(
    aggressiveRevenue,
    monthlyInvestment,
  );

  return [
    `Based on industry benchmarks for **${verticalName}** companies and ` +
      `our platform performance data, here are three projection scenarios:`,
    "",
    "| Metric | Conservative | Moderate | Aggressive |",
    "|--------|-------------|----------|------------|",
    `| Monthly leads | ${projectedLeads} | ${moderateLeads} | ${aggressiveLeads} |`,
    `| Close rate | ${fmtPct(closeRate)} | ${fmtPct(moderateCloseRate)} | ${fmtPct(aggressiveCloseRate)} |`,
    `| New jobs/month | ${conservativeJobs} | ${moderateJobs} | ${aggressiveJobs} |`,
    `| Avg job value | $${avgJobValue.toLocaleString()} | $${avgJobValue.toLocaleString()} | $${avgJobValue.toLocaleString()} |`,
    `| Monthly revenue | $${conservativeRevenue.toLocaleString()} | $${moderateRevenue.toLocaleString()} | $${aggressiveRevenue.toLocaleString()} |`,
    `| Monthly investment | $${monthlyInvestment.toLocaleString()} | $${monthlyInvestment.toLocaleString()} | $${monthlyInvestment.toLocaleString()} |`,
    `| **ROI** | **${conservativeROI}x** | **${moderateROI}x** | **${aggressiveROI}x** |`,
    "",
    "### Industry Benchmarks",
    "",
    `- Average ${verticalName} job value: **$${benchmark.avgJobValue.toLocaleString()}**`,
    `- Typical close rate: **${fmtPct(benchmark.closeRate)}**`,
    `- Typical response rate: **${fmtPct(benchmark.responseRate)}**`,
    `- Average leads/month (traditional channels): **${benchmark.leadsPerMonth}**`,
    "",
    "*Conservative projections use your provided close rate. " +
      "Moderate and aggressive scenarios factor in platform optimization " +
      "over the first 90 days.*",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Public API: generateTimeline
// ---------------------------------------------------------------------------

/**
 * Creates an implementation timeline with phased dates starting from the
 * proposal date.
 *
 * @param proposalDate - ISO date string for the proposal creation date.
 * @param selectedServices - Services selected for this proposal.
 * @returns Formatted markdown string with a phased implementation plan.
 */
export function generateTimeline(
  proposalDate: string,
  selectedServices: ServiceId[],
): string {
  const start = new Date(proposalDate);

  const phases = buildPhases(start, selectedServices);

  const phaseBlocks = phases
    .map((phase) => {
      const taskList = phase.tasks.map((t) => `  - ${t}`).join("\n");
      return (
        `### Phase ${phase.number}: ${phase.name}\n` +
        `**${phase.startLabel} -- ${phase.endLabel}** ` +
        `(${phase.durationLabel})\n\n` +
        taskList
      );
    })
    .join("\n\n");

  return [
    "Below is the phased rollout plan from contract signing to full production.",
    "",
    phaseBlocks,
    "",
    "*Timeline assumes prompt completion of onboarding tasks " +
      "(account access, branding assets, service area confirmation).*",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Public API: buildProposalSections
// ---------------------------------------------------------------------------

/**
 * Assembles all proposal sections based on the client profile, selected
 * services, and configuration.
 *
 * @param data - Complete proposal input data.
 * @returns Array of ProposalSection objects, sorted by display order.
 */
export function buildProposalSections(
  data: ProposalData,
): ProposalSection[] {
  const includedTypes = data.config.includedSections
    ?? SECTION_TEMPLATES.map((t) => t.type);

  const builders: Record<SectionType, (d: ProposalData) => string> = {
    executive_summary: buildExecutiveSummary,
    problem_statement: buildProblemStatement,
    proposed_solution: buildProposedSolution,
    pricing_breakdown: buildPricingBreakdown,
    roi_projections: buildROIProjections,
    implementation_timeline: buildImplementationTimeline,
    case_studies: buildCaseStudies,
    competitive_advantage: () => buildCompetitiveAdvantage(),
    terms_next_steps: buildTermsAndNextSteps,
    about_sovereign: () => buildAboutSovereign(),
  };

  return SECTION_TEMPLATES.filter((template) =>
    includedTypes.includes(template.type),
  ).map((template) => ({
    type: template.type,
    title: template.title,
    content: builders[template.type](data),
    order: template.order,
    included: true,
  }));
}

// ---------------------------------------------------------------------------
// Public API: formatProposalAsMarkdown
// ---------------------------------------------------------------------------

/**
 * Renders all included proposal sections as a single formatted markdown
 * document.
 *
 * @param data - Complete proposal input data.
 * @returns A full markdown string representing the proposal.
 */
export function formatProposalAsMarkdown(data: ProposalData): string {
  const sections = buildProposalSections(data);
  const dateFormatted = formatDateForDisplay(data.proposalDate);

  const header = [
    "---",
    `title: Proposal for ${data.companyName}`,
    `date: ${data.proposalDate}`,
    `vertical: ${data.vertical}`,
    `service_area: ${data.serviceArea}`,
    "---",
    "",
    `# Lead Generation Proposal for ${data.companyName}`,
    "",
    `**Prepared for:** ${data.contactName}`,
    `**Date:** ${dateFormatted}`,
    `**Prepared by:** Sovereign AI`,
    "",
    "---",
  ].join("\n");

  const body = sections
    .map(
      (section) =>
        `## ${section.title}\n\n${section.content}`,
    )
    .join("\n\n---\n\n");

  const footer = [
    "",
    "---",
    "",
    "*This proposal was generated by Sovereign AI. " +
      "All projections are estimates based on industry benchmarks " +
      "and platform performance data. Actual results may vary.*",
    "",
    "Sovereign AI -- AI-Powered Lead Generation for Home Service Contractors",
  ].join("\n");

  return `${header}\n\n${body}\n${footer}\n`;
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

function formatVerticalName(vertical: VerticalId): string {
  const names: Record<VerticalId, string> = {
    hvac: "HVAC",
    plumbing: "Plumbing",
    roofing: "Roofing",
    electrical: "Electrical",
    landscaping: "Landscaping",
    "general-contractor": "General Contracting",
    other: "Home Services",
  };
  return names[vertical] ?? "Home Services";
}

function calculateROIMultiple(revenue: number, cost: number): string {
  if (cost <= 0) return "N/A";
  return (revenue / cost).toFixed(1);
}

function fmtPct(decimal: number): string {
  return `${(decimal * 100).toFixed(0)}%`;
}

function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function computeValidUntilDate(
  proposalDate: string,
  validForDays: number,
): string {
  const date = new Date(proposalDate);
  date.setDate(date.getDate() + validForDays);
  return formatDateForDisplay(date.toISOString());
}

// ---------------------------------------------------------------------------
// Internal: Case Study Data
// ---------------------------------------------------------------------------

interface CaseStudy {
  company: string;
  trade: string;
  quote: string;
  result: string;
  verticals: VerticalId[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    company: "Desert Comfort HVAC",
    trade: "HVAC",
    quote:
      "We went from 12 leads/month to 48 in the first 90 days. " +
      "The AI follow-up alone closed 6 extra jobs we would have lost.",
    result: "4x lead volume, $187K additional revenue in Q1",
    verticals: ["hvac"],
  },
  {
    company: "Summit Roofing Co.",
    trade: "Roofing",
    quote:
      "After a hail storm, Sovereign found 200+ homeowners in our " +
      "service area before our competitors even started door-knocking.",
    result: "42 leads/month at $18 CPL, 23% close rate",
    verticals: ["roofing"],
  },
  {
    company: "FlowRight Plumbing",
    trade: "Plumbing",
    quote:
      "The AI voice agent handles after-hours calls and books " +
      "appointments directly into our calendar. We stopped losing " +
      "emergency calls to voicemail.",
    result: "38 leads/month, 31% close rate, $22K/mo new revenue",
    verticals: ["plumbing"],
  },
  {
    company: "Bright Wire Electric",
    trade: "Electrical",
    quote:
      "EV charger leads alone paid for the entire service in month one. " +
      "The panel upgrade pipeline is a bonus.",
    result: "29 leads/month, $14K/mo new revenue, 8.2x ROI",
    verticals: ["electrical"],
  },
  {
    company: "GreenScape Pros",
    trade: "Landscaping",
    quote:
      "We filled our spring schedule by February. The off-season " +
      "outreach for design/build projects was a game changer.",
    result: "35 leads/month, 3 design/build projects closed in Q1",
    verticals: ["landscaping"],
  },
  {
    company: "Precision Builders",
    trade: "General Contracting",
    quote:
      "Sovereign's permit data mining found homeowners who just " +
      "pulled remodel permits. Perfect timing for our services.",
    result: "18 leads/month, $64K average project value",
    verticals: ["general-contractor", "other"],
  },
];

function getCaseStudiesForVertical(vertical: VerticalId): CaseStudy[] {
  const directMatches = CASE_STUDIES.filter((cs) =>
    cs.verticals.includes(vertical),
  );
  if (directMatches.length >= 2) return directMatches;

  // Fall back to showing a mix if not enough direct matches
  const others = CASE_STUDIES.filter(
    (cs) => !cs.verticals.includes(vertical),
  ).slice(0, 2 - directMatches.length);
  return [...directMatches, ...others];
}

// ---------------------------------------------------------------------------
// Internal: Timeline Phase Builder
// ---------------------------------------------------------------------------

interface TimelinePhase {
  number: number;
  name: string;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  tasks: string[];
}

function buildPhases(
  startDate: Date,
  selectedServices: ServiceId[],
): TimelinePhase[] {
  const phases: TimelinePhase[] = [];

  // Phase 1: Onboarding (Days 1-3)
  const phase1Start = new Date(startDate);
  const phase1End = addDays(phase1Start, 3);
  phases.push({
    number: 1,
    name: "Onboarding & Setup",
    startLabel: fmtDate(phase1Start),
    endLabel: fmtDate(phase1End),
    durationLabel: "3 business days",
    tasks: [
      "Kickoff call and goal alignment",
      "Service area and target profile configuration",
      "Brand assets collection (logo, colors, messaging tone)",
      "Account access setup (Google Business, CRM, etc.)",
      "Data source activation and initial prospect scan",
    ],
  });

  // Phase 2: Campaign Launch (Days 4-7)
  const phase2Start = addDays(phase1End, 1);
  const phase2End = addDays(phase2Start, 3);
  phases.push({
    number: 2,
    name: "Campaign Launch",
    startLabel: fmtDate(phase2Start),
    endLabel: fmtDate(phase2End),
    durationLabel: "4 business days",
    tasks: [
      "Outreach sequence creation and approval",
      "Email and SMS template personalization",
      "Contact verification pipeline activation",
      "First batch of verified leads delivered",
      ...(selectedServices.includes("voice-agent")
        ? ["AI voice agent configuration and script approval"]
        : []),
      ...(selectedServices.includes("chatbot")
        ? ["Chatbot deployment and training"]
        : []),
    ],
  });

  // Phase 3: Optimization (Weeks 2-4)
  const phase3Start = addDays(phase2End, 1);
  const phase3End = addDays(phase3Start, 20);
  phases.push({
    number: 3,
    name: "Optimization & Scaling",
    startLabel: fmtDate(phase3Start),
    endLabel: fmtDate(phase3End),
    durationLabel: "Weeks 2-4",
    tasks: [
      "Response rate analysis and messaging optimization",
      "Lead quality feedback loop with your team",
      "A/B testing on outreach subject lines and timing",
      "Follow-up sequence tuning based on engagement data",
      ...(selectedServices.includes("seo")
        ? ["Google Business Profile optimization launched"]
        : []),
      ...(selectedServices.includes("reviews")
        ? ["Review request automation activated"]
        : []),
      ...(selectedServices.includes("ads")
        ? ["Paid advertising campaign launch and budget allocation"]
        : []),
    ],
  });

  // Phase 4: Full Production (Month 2+)
  const phase4Start = addDays(phase3End, 1);
  const phase4End = addDays(phase4Start, 29);
  phases.push({
    number: 4,
    name: "Full Production",
    startLabel: fmtDate(phase4Start),
    endLabel: fmtDate(phase4End) + "+",
    durationLabel: "Month 2 onward",
    tasks: [
      "Full lead volume delivery at target rate",
      "Weekly performance reporting and ROI tracking",
      "Monthly strategy call with your account team",
      "Continuous AI model tuning based on conversion data",
      "Quarterly business review with growth recommendations",
      ...(selectedServices.includes("content")
        ? ["Monthly SEO blog content published"]
        : []),
      ...(selectedServices.includes("social")
        ? ["Social media content calendar in production"]
        : []),
    ],
  });

  return phases;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
