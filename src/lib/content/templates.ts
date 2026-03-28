/**
 * Content post templates for the Sovereign Empire platform.
 * Provides structured templates with variable interpolation for
 * LinkedIn posts, X/Twitter threads, and YouTube video scripts.
 *
 * @module templates
 */

// ---------------------------------------------------------------------------
// Context Interfaces
// ---------------------------------------------------------------------------

/** Context for the "System in Action" LinkedIn post template. */
export interface SystemInActionContext {
  vertical: string;
  city: string;
  leadCount: number;
  timeframe: string;
  sources: Array<{ name: string; count: number; trigger: string }>;
}

/** Context for the "Contrarian Take" LinkedIn post template. */
export interface ContrarianTakeContext {
  contrarianStatement: string;
  /** 2-3 sentence explanation of the contrarian position. */
  explanation: string;
  vertical: string;
  commonBehavior: string;
  differentBehavior: string;
  proofPoint: string;
  reframe: string;
}

/** Context for the "Client Win" LinkedIn post template. */
export interface ClientWinContext {
  clientType: string;
  city: string;
  week1Leads: number;
  week2Leads: number;
  week2Replies: number;
  week3Appointments: number;
  week4Jobs: number;
  revenue: number;
  monthlyCost: number;
}

/** Context for the "Educational Tip" LinkedIn post template. */
export interface EducationalTipContext {
  vertical: string;
  lostAmount: number;
  mistake: string;
  rootCause: string;
  fixSteps: string[];
  seasonalTrigger: string;
}

/** Context for the "Behind the Build" X/Twitter thread template. */
export interface BehindTheBuildContext {
  service: string;
  sourceCount: number;
  scoringSignals: number;
  vertical: string;
  sampleName?: string;
  sampleNeighborhood?: string;
  sampleCity?: string;
}

/** Context for the "System Demo" YouTube video script. */
export interface SystemDemoContext {
  vertical: string;
  city: string;
  state: string;
  leadsFound: number;
  sampleAddress: string;
  homeAge: number;
  monthsSinceSale: number;
  leadScore: number;
  monthlyLeads: number;
  monthlyContacted: number;
  monthlyResponded: number;
  monthlyBooked: number;
  costPerLead: number;
  avgJobValue: number;
  roiMultiplier: number;
}

// ---------------------------------------------------------------------------
// Template & Script Types
// ---------------------------------------------------------------------------

/** Identifiers for available post templates. */
export type PostTemplate =
  | "system_in_action"
  | "contrarian_take"
  | "client_win"
  | "educational_tip"
  | "behind_the_build";

/** Identifiers for available video script templates. */
export type VideoScript = "system_demo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a number as US-dollar currency without cents.
 *
 * @param amount - The numeric amount to format.
 * @returns A string such as `"$1,500"`.
 */
function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/**
 * Format a number with comma separators.
 */
function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// ---------------------------------------------------------------------------
// Post Generators (private)
// ---------------------------------------------------------------------------

function generateSystemInAction(ctx: SystemInActionContext): string {
  const sourceLines = ctx.sources
    .map((s) => `\u2192 ${s.name}: ${formatNumber(s.count)} homeowners with ${s.trigger}`)
    .join("\n");

  return [
    `I just ran our AI discovery engine for a ${ctx.vertical} company in ${ctx.city}.`,
    "",
    `${formatNumber(ctx.leadCount)} qualified leads found in ${ctx.timeframe}.`,
    "",
    "Here's what the system pulled:",
    sourceLines,
    "",
    "Each one scored, verified, and ready for personalized outreach.",
    "",
    "This is what AI lead gen looks like when you own the infrastructure instead of renting someone else's.",
    "",
    "[screenshot of dashboard or lead pipeline]",
    "",
    `If you run a ${ctx.vertical} company and want to see what this looks like for your market \u2014 link in comments.`,
  ].join("\n");
}

function generateContrarianTake(ctx: ContrarianTakeContext): string {
  return [
    ctx.contrarianStatement,
    "",
    ctx.explanation,
    "",
    `Most ${ctx.vertical} companies ${ctx.commonBehavior}.`,
    "",
    `We ${ctx.differentBehavior}.`,
    "",
    ctx.proofPoint,
    "",
    ctx.reframe,
  ].join("\n");
}

function generateClientWin(ctx: ClientWinContext): string {
  const roi = (ctx.revenue / ctx.monthlyCost).toFixed(1);

  return [
    `New case study: ${ctx.clientType} in ${ctx.city}`,
    "",
    "Here's what happened in 30 days:",
    "",
    `Week 1: ${formatNumber(ctx.week1Leads)} leads identified and enriched`,
    `Week 2: ${formatNumber(ctx.week2Leads)} contacted, ${formatNumber(ctx.week2Replies)} replies`,
    `Week 3: ${formatNumber(ctx.week3Appointments)} appointments booked`,
    `Week 4: ${formatNumber(ctx.week4Jobs)} jobs closed \u2014 ${formatCurrency(ctx.revenue)} revenue`,
    "",
    `Total investment: ${formatCurrency(ctx.monthlyCost)}/month`,
    `ROI: ${roi}x`,
    "",
    "No cold calling. No bought lists. No door knocking.",
    "",
    "Just an AI system that finds the right homeowners at the right time and starts the conversation for you.",
    "",
    `If you're a ${ctx.clientType} tired of chasing leads \u2014 link in comments.`,
  ].join("\n");
}

function generateEducationalTip(ctx: EducationalTipContext): string {
  const stepsText = ctx.fixSteps
    .map((step, i) => `${i + 1}. ${step}`)
    .join("\n");

  return [
    `${ctx.vertical} companies are losing ${formatCurrency(ctx.lostAmount)}+/year on this one mistake:`,
    "",
    ctx.mistake,
    "",
    `The root cause: ${ctx.rootCause}`,
    "",
    "Here's how to fix it:",
    stepsText,
    "",
    `Pro tip: ${ctx.seasonalTrigger} is the best time to implement this \u2014 your competitors won't catch up until next season.`,
    "",
    "Save this post. You'll need it.",
  ].join("\n");
}

function generateBehindTheBuild(ctx: BehindTheBuildContext): string[] {
  const sampleName = ctx.sampleName ?? "John";
  const sampleNeighborhood = ctx.sampleNeighborhood ?? "Oak Park";
  const sampleCity = ctx.sampleCity ?? "Chicago";

  return [
    // Tweet 1
    `We just finished building an AI lead-gen system for ${ctx.vertical} companies.\n\nHere's exactly how it works (thread) \ud83e\uddf5`,

    // Tweet 2
    `The system starts by scanning ${formatNumber(ctx.sourceCount)} data sources for ${ctx.service} signals.\n\nProperty records, permit data, satellite imagery, social signals, and more.\n\nIt's not scraping \u2014 it's discovery.`,

    // Tweet 3
    `Every lead gets scored using ${formatNumber(ctx.scoringSignals)} signals.\n\nHome age, last sale date, neighborhood trends, permit history, insurance claims, and more.\n\nOnly the highest-scoring leads make it through.`,

    // Tweet 4
    `Then we enrich each lead with contact data, property details, and behavioral signals.\n\nBy the time you see a lead, you know more about their home than they do.`,

    // Tweet 5
    `Example: ${sampleName} in ${sampleNeighborhood}, ${sampleCity}.\n\nThe system flagged his property because of 3 converging signals \u2014 and he didn't even know he needed ${ctx.service} yet.`,

    // Tweet 6
    `The outreach is personalized at scale.\n\nEvery message references their specific property, neighborhood, and situation.\n\nIt doesn't feel like marketing. It feels like a neighbor who happens to know a great ${ctx.vertical} company.`,

    // Tweet 7
    `The best part? Our clients own this system.\n\nNo per-lead fees. No middlemen. No rented data.\n\nIt runs on their infrastructure and they keep 100% of the leads.`,

    // Tweet 8
    `If you run a ${ctx.vertical} company and want a system like this built for your market \u2014 DM me.\n\nWe only work with one company per metro area.`,
  ];
}

// ---------------------------------------------------------------------------
// generatePost (overloads)
// ---------------------------------------------------------------------------

/**
 * Generate a "System in Action" LinkedIn post.
 *
 * @param template - `"system_in_action"`
 * @param context  - Variables to interpolate into the template.
 * @returns The fully rendered post as a string.
 */
export function generatePost(
  template: "system_in_action",
  context: SystemInActionContext,
): string;

/**
 * Generate a "Contrarian Take" LinkedIn post.
 *
 * @param template - `"contrarian_take"`
 * @param context  - Variables to interpolate into the template.
 * @returns The fully rendered post as a string.
 */
export function generatePost(
  template: "contrarian_take",
  context: ContrarianTakeContext,
): string;

/**
 * Generate a "Client Win" LinkedIn post.
 *
 * @param template - `"client_win"`
 * @param context  - Variables to interpolate into the template.
 * @returns The fully rendered post as a string.
 */
export function generatePost(
  template: "client_win",
  context: ClientWinContext,
): string;

/**
 * Generate an "Educational Tip" LinkedIn post.
 *
 * @param template - `"educational_tip"`
 * @param context  - Variables to interpolate into the template.
 * @returns The fully rendered post as a string.
 */
export function generatePost(
  template: "educational_tip",
  context: EducationalTipContext,
): string;

/**
 * Generate a "Behind the Build" X/Twitter thread.
 *
 * @param template - `"behind_the_build"`
 * @param context  - Variables to interpolate into the template.
 * @returns An array of tweet strings (one per tweet in the thread).
 */
export function generatePost(
  template: "behind_the_build",
  context: BehindTheBuildContext,
): string[];

/**
 * Generate a post from one of the available content templates.
 *
 * Uses function overloads so callers get precise return types:
 * - Most templates return a single `string`.
 * - `"behind_the_build"` returns `string[]` (one entry per tweet).
 */
export function generatePost(
  template: PostTemplate,
  context:
    | SystemInActionContext
    | ContrarianTakeContext
    | ClientWinContext
    | EducationalTipContext
    | BehindTheBuildContext,
): string | string[] {
  switch (template) {
    case "system_in_action":
      return generateSystemInAction(context as SystemInActionContext);
    case "contrarian_take":
      return generateContrarianTake(context as ContrarianTakeContext);
    case "client_win":
      return generateClientWin(context as ClientWinContext);
    case "educational_tip":
      return generateEducationalTip(context as EducationalTipContext);
    case "behind_the_build":
      return generateBehindTheBuild(context as BehindTheBuildContext);
    default: {
      const _exhaustive: never = template;
      throw new Error(`Unknown template: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// generateVideoScript
// ---------------------------------------------------------------------------

/**
 * Generate a "System Demo" YouTube video script (~7 min).
 *
 * @param script  - `"system_demo"`
 * @param context - Variables to interpolate into the script.
 * @returns The fully rendered video script as a string with section markers.
 */
export function generateVideoScript(
  script: "system_demo",
  context: SystemDemoContext,
): string;

export function generateVideoScript(
  script: VideoScript,
  context: SystemDemoContext,
): string {
  switch (script) {
    case "system_demo":
      return generateSystemDemo(context);
    default: {
      const _exhaustive: never = script;
      throw new Error(`Unknown video script: ${_exhaustive}`);
    }
  }
}

function generateSystemDemo(ctx: SystemDemoContext): string {
  return [
    "=== SYSTEM DEMO VIDEO SCRIPT (~7 min) ===",
    "",
    "[INTRO - 0:00]",
    "",
    `What if I told you there's an AI system that can find ${formatNumber(ctx.leadsFound)} qualified ${ctx.vertical} leads in ${ctx.city}, ${ctx.state} \u2014 in minutes?`,
    "",
    `Today I'm going to show you exactly how it works, step by step.`,
    "",
    `Let's dive in.`,
    "",
    "[DISCOVERY ENGINE - 1:00]",
    "",
    `First, I'm going to set the target market: ${ctx.vertical} in ${ctx.city}, ${ctx.state}.`,
    "",
    `The AI discovery engine is now scanning public records, property data, permit histories, and more.`,
    "",
    `And just like that \u2014 ${formatNumber(ctx.leadsFound)} qualified leads.`,
    "",
    `Let me click into one to show you what we're working with.`,
    "",
    "[LEAD DEEP DIVE - 2:30]",
    "",
    `Here's ${ctx.sampleAddress}.`,
    "",
    `The home is ${ctx.homeAge} years old. Last sold ${ctx.monthsSinceSale} months ago.`,
    "",
    `Our scoring algorithm gave this a ${ctx.leadScore}/100 \u2014 that's a high-intent lead.`,
    "",
    `The system already has the homeowner's contact info, property details, and the specific signals that flagged this property.`,
    "",
    "[OUTREACH PREVIEW - 4:00]",
    "",
    `Now here's where it gets powerful.`,
    "",
    `The system generates personalized outreach for each lead \u2014 referencing their specific property, neighborhood, and situation.`,
    "",
    `This isn't a mail merge. This is AI that understands context.`,
    "",
    "[PIPELINE METRICS - 5:00]",
    "",
    `Let me show you the numbers from a live campaign:`,
    "",
    `\u2022 ${formatNumber(ctx.monthlyLeads)} leads identified per month`,
    `\u2022 ${formatNumber(ctx.monthlyContacted)} contacted`,
    `\u2022 ${formatNumber(ctx.monthlyResponded)} responded`,
    `\u2022 ${formatNumber(ctx.monthlyBooked)} appointments booked`,
    "",
    `Cost per lead: ${formatCurrency(ctx.costPerLead)}`,
    `Average job value: ${formatCurrency(ctx.avgJobValue)}`,
    `ROI: ${ctx.roiMultiplier}x`,
    "",
    "[CLOSING - 6:00]",
    "",
    `This is what happens when you own the AI infrastructure instead of renting it.`,
    "",
    `No per-lead fees. No shared leads. No middlemen.`,
    "",
    `If you run a ${ctx.vertical} company and want a system like this for ${ctx.city} \u2014 link in the description.`,
    "",
    `We only work with one company per metro area, so if your market is still open, let's talk.`,
    "",
    "=== END SCRIPT ===",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// getAvailableTemplates
// ---------------------------------------------------------------------------

/**
 * Returns metadata for all available post templates.
 *
 * Useful for building UIs that let users select a template before
 * providing the required context variables.
 */
export function getAvailableTemplates(): Array<{
  id: PostTemplate;
  name: string;
  platform: string;
  description: string;
}> {
  return [
    {
      id: "system_in_action",
      name: "System in Action",
      platform: "LinkedIn",
      description:
        "Showcase the AI discovery engine running for a specific vertical and city with real lead counts and source breakdowns.",
    },
    {
      id: "contrarian_take",
      name: "Contrarian Take",
      platform: "LinkedIn",
      description:
        "Challenge conventional industry wisdom with a bold statement, proof point, and strategic reframe.",
    },
    {
      id: "client_win",
      name: "Client Win",
      platform: "LinkedIn",
      description:
        "Week-by-week case study showing a client's 30-day journey from leads to closed revenue with ROI calculation.",
    },
    {
      id: "educational_tip",
      name: "Educational Tip",
      platform: "LinkedIn",
      description:
        "Highlight a costly industry mistake with root cause analysis and actionable fix steps tied to a seasonal trigger.",
    },
    {
      id: "behind_the_build",
      name: "Behind the Build",
      platform: "X/Twitter",
      description:
        "8-tweet thread walking through how the AI lead-gen system works from discovery to outreach.",
    },
  ];
}
