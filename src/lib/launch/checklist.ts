/**
 * Sovereign Empire Pre-Launch Checklist Module
 *
 * Tracks every checkbox item from LAUNCH.md across all phases,
 * with completion state, progress reporting, and Telegram formatting.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The five sequential launch phases. */
export type LaunchPhase =
  | "identity"
  | "infrastructure"
  | "sales_assets"
  | "delivery_readiness"
  | "go_live";

/** A single checklist item definition (immutable). */
export interface ChecklistItem {
  id: string;
  phase: LaunchPhase;
  category: string;
  label: string;
  description?: string;
  order: number;
  /** If true, this item blocks launch when incomplete. */
  critical: boolean;
}

/** Mutable state tracking completion of checklist items. */
export interface ChecklistState {
  items: Record<
    string,
    { completed: boolean; completedAt?: Date; notes?: string }
  >;
  startedAt: Date;
}

/** Progress summary for a single phase. */
export interface PhaseProgress {
  total: number;
  completed: number;
  percentage: number;
  criticalRemaining: ChecklistItem[];
}

/** Progress summary across all phases. */
export interface OverallProgress {
  total: number;
  completed: number;
  percentage: number;
  currentPhase: LaunchPhase;
  /** True only when every critical item is complete. */
  readyToLaunch: boolean;
  /** Critical items that are not yet done. */
  blockers: ChecklistItem[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_ORDER: LaunchPhase[] = [
  "identity",
  "infrastructure",
  "sales_assets",
  "delivery_readiness",
  "go_live",
];

const PHASE_LABELS: Record<LaunchPhase, string> = {
  identity: "Phase 0: Identity",
  infrastructure: "Phase 1: Infrastructure",
  sales_assets: "Phase 2: Sales Assets",
  delivery_readiness: "Phase 3: Delivery Readiness",
  go_live: "Phase 4: Go Live",
};

/**
 * Estimated duration in days for each phase (from LAUNCH.md).
 * Ranges use the midpoint for estimation.
 */
const PHASE_DAYS: Record<LaunchPhase, number> = {
  identity: 1,
  infrastructure: 2.5,
  sales_assets: 1.5,
  delivery_readiness: 2.5,
  go_live: 1,
};

// ---------------------------------------------------------------------------
// Checklist Items
// ---------------------------------------------------------------------------

/** The complete pre-launch checklist derived from LAUNCH.md. */
export const LAUNCH_CHECKLIST: ChecklistItem[] = [
  // ── Phase 0: Identity ── domain_email ──
  {
    id: "register_domain",
    phase: "identity",
    category: "domain_email",
    label: "Register domain (sovereignempire.com)",
    order: 1,
    critical: true,
  },
  {
    id: "setup_email",
    phase: "identity",
    category: "domain_email",
    label: "Set up professional email (seth@domain)",
    order: 2,
    critical: true,
  },
  {
    id: "configure_dns_auth",
    phase: "identity",
    category: "domain_email",
    label: "Configure SPF, DKIM, DMARC records",
    order: 3,
    critical: true,
  },
  {
    id: "start_email_warmup",
    phase: "identity",
    category: "domain_email",
    label: "Start email warmup (20 emails/day, 2 weeks min)",
    order: 4,
    critical: true,
  },
  {
    id: "setup_outreach_domain",
    phase: "identity",
    category: "domain_email",
    label: "Set up separate outreach domain",
    description: "Optional but recommended to protect primary domain reputation",
    order: 5,
    critical: false,
  },

  // ── Phase 0: Identity ── business_basics ──
  {
    id: "business_entity",
    phase: "identity",
    category: "business_basics",
    label: "Business entity (LLC) filed",
    order: 6,
    critical: true,
  },
  {
    id: "get_ein",
    phase: "identity",
    category: "business_basics",
    label: "Get EIN from IRS",
    order: 7,
    critical: true,
  },
  {
    id: "business_bank_account",
    phase: "identity",
    category: "business_basics",
    label: "Open business bank account",
    order: 8,
    critical: true,
  },
  {
    id: "business_address",
    phase: "identity",
    category: "business_basics",
    label: "Physical address for CAN-SPAM compliance",
    order: 9,
    critical: true,
  },
  {
    id: "business_phone",
    phase: "identity",
    category: "business_basics",
    label: "Business phone number (Google Voice or Twilio)",
    order: 10,
    critical: true,
  },
  {
    id: "professional_headshot",
    phase: "identity",
    category: "business_basics",
    label: "Professional headshot / brand photo",
    order: 11,
    critical: false,
  },

  // ── Phase 1: Infrastructure ── supabase ──
  {
    id: "create_supabase",
    phase: "infrastructure",
    category: "supabase",
    label: "Create Supabase project",
    order: 12,
    critical: true,
  },
  {
    id: "run_db_schema",
    phase: "infrastructure",
    category: "supabase",
    label: "Run database schema (all tables, indexes, RLS)",
    order: 13,
    critical: true,
  },
  {
    id: "create_api_keys",
    phase: "infrastructure",
    category: "supabase",
    label: "Create API keys (anon + service_role)",
    order: 14,
    critical: true,
  },
  {
    id: "test_db_connection",
    phase: "infrastructure",
    category: "supabase",
    label: "Test database connection",
    order: 15,
    critical: true,
  },

  // ── Phase 1: Infrastructure ── stripe ──
  {
    id: "create_stripe",
    phase: "infrastructure",
    category: "stripe",
    label: "Create Stripe account + complete verification",
    order: 16,
    critical: true,
  },
  {
    id: "create_products",
    phase: "infrastructure",
    category: "stripe",
    label: "Create Products + Prices (Starter/Growth/Scale/Enterprise)",
    order: 17,
    critical: true,
  },
  {
    id: "setup_stripe_webhook",
    phase: "infrastructure",
    category: "stripe",
    label: "Set up webhook endpoint",
    order: 18,
    critical: true,
  },
  {
    id: "create_payment_links",
    phase: "infrastructure",
    category: "stripe",
    label: "Create payment links for proposals",
    order: 19,
    critical: true,
  },
  {
    id: "test_stripe",
    phase: "infrastructure",
    category: "stripe",
    label: "Test subscription + webhook + dunning in test mode",
    order: 20,
    critical: true,
  },

  // ── Phase 1: Infrastructure ── telegram ──
  {
    id: "create_telegram_bot",
    phase: "infrastructure",
    category: "telegram",
    label: "Create bot via @BotFather",
    order: 21,
    critical: true,
  },
  {
    id: "get_chat_id",
    phase: "infrastructure",
    category: "telegram",
    label: "Get operator chat_id",
    order: 22,
    critical: true,
  },
  {
    id: "implement_core_commands",
    phase: "infrastructure",
    category: "telegram",
    label: "Implement /status and /health commands",
    order: 23,
    critical: true,
  },
  {
    id: "test_telegram_alerts",
    phase: "infrastructure",
    category: "telegram",
    label: "Test alerts arrive on phone",
    order: 24,
    critical: true,
  },

  // ── Phase 1: Infrastructure ── twilio ──
  {
    id: "create_twilio",
    phase: "infrastructure",
    category: "twilio",
    label: "Create Twilio account + fund $20",
    order: 25,
    critical: true,
  },
  {
    id: "provision_phone",
    phase: "infrastructure",
    category: "twilio",
    label: "Provision Arizona phone number (SMS + Voice)",
    order: 26,
    critical: true,
  },
  {
    id: "configure_sms_webhook",
    phase: "infrastructure",
    category: "twilio",
    label: "Configure inbound SMS webhook",
    order: 27,
    critical: true,
  },
  {
    id: "test_twilio",
    phase: "infrastructure",
    category: "twilio",
    label: "Test SMS send, STOP processing, reply logging",
    order: 28,
    critical: true,
  },

  // ── Phase 1: Infrastructure ── claude_api ──
  {
    id: "anthropic_api_key",
    phase: "infrastructure",
    category: "claude_api",
    label: "Anthropic API key configured",
    order: 29,
    critical: true,
  },
  {
    id: "set_usage_alerts",
    phase: "infrastructure",
    category: "claude_api",
    label: "Set usage alerts at $50/day",
    order: 30,
    critical: true,
  },
  {
    id: "test_claude_wrapper",
    phase: "infrastructure",
    category: "claude_api",
    label: "Test Claude wrapper (Sonnet + Haiku)",
    order: 31,
    critical: true,
  },

  // ── Phase 1: Infrastructure ── hosting ──
  {
    id: "choose_hosting",
    phase: "infrastructure",
    category: "hosting",
    label: "Choose and set up hosting provider",
    order: 32,
    critical: true,
  },
  {
    id: "deploy_core",
    phase: "infrastructure",
    category: "hosting",
    label: "Deploy core application (API + scheduler + bot)",
    order: 33,
    critical: true,
  },
  {
    id: "set_env_vars",
    phase: "infrastructure",
    category: "hosting",
    label: "Set environment variables on host",
    order: 34,
    critical: true,
  },
  {
    id: "verify_deployment",
    phase: "infrastructure",
    category: "hosting",
    label: "Verify: /health green, /status works, scheduler firing",
    order: 35,
    critical: true,
  },

  // ── Phase 2: Sales Assets ── landing_page ──
  {
    id: "build_landing_page",
    phase: "sales_assets",
    category: "landing_page",
    label: "Build landing page (hero, problem, solution, pricing, CTA)",
    order: 36,
    critical: true,
  },
  {
    id: "setup_lead_capture",
    phase: "sales_assets",
    category: "landing_page",
    label: "Lead capture form \u2192 Supabase + Telegram alert + auto-reply",
    order: 37,
    critical: true,
  },
  {
    id: "setup_calendly",
    phase: "sales_assets",
    category: "landing_page",
    label: "Calendly/Cal.com scheduling link (15-min, Mon-Fri 9-4 AZ)",
    order: 38,
    critical: true,
  },

  // ── Phase 2: Sales Assets ── proposal ──
  {
    id: "create_proposal_template",
    phase: "sales_assets",
    category: "proposal",
    label: "Proposal PDF template (auto-populate with Claude)",
    order: 39,
    critical: true,
  },
  {
    id: "test_proposal_flow",
    phase: "sales_assets",
    category: "proposal",
    label: "Test proposal generation + payment link",
    order: 40,
    critical: true,
  },

  // ── Phase 2: Sales Assets ── collateral ──
  {
    id: "email_signature",
    phase: "sales_assets",
    category: "collateral",
    label: "Professional email signature configured",
    order: 41,
    critical: false,
  },
  {
    id: "one_pager_pdf",
    phase: "sales_assets",
    category: "collateral",
    label: "One-pager PDF (what/who/how/pricing)",
    order: 42,
    critical: false,
  },
  {
    id: "case_study_template",
    phase: "sales_assets",
    category: "collateral",
    label: "Case study template ready to fill",
    order: 43,
    critical: false,
  },
  {
    id: "linkedin_optimized",
    phase: "sales_assets",
    category: "collateral",
    label: "LinkedIn profile optimized (headline, about, featured, banner)",
    order: 44,
    critical: false,
  },

  // ── Phase 3: Delivery Readiness ── discovery_sources ──
  {
    id: "test_permits",
    phase: "delivery_readiness",
    category: "discovery_sources",
    label: "Maricopa County building permits scraper working",
    order: 45,
    critical: true,
  },
  {
    id: "test_google_maps",
    phase: "delivery_readiness",
    category: "discovery_sources",
    label: "Google Maps local signals working",
    order: 46,
    critical: true,
  },
  {
    id: "test_real_estate",
    phase: "delivery_readiness",
    category: "discovery_sources",
    label: "Real estate / home sales data source working",
    order: 47,
    critical: false,
  },
  {
    id: "two_sources_working",
    phase: "delivery_readiness",
    category: "discovery_sources",
    label: "At least 2 discovery sources producing leads",
    order: 48,
    critical: true,
  },

  // ── Phase 3: Delivery Readiness ── outreach_pipeline ──
  {
    id: "test_email_e2e",
    phase: "delivery_readiness",
    category: "outreach_pipeline",
    label: "Email sending tested end-to-end (personalize \u2192 compliance \u2192 send)",
    order: 49,
    critical: true,
  },
  {
    id: "verify_email_compliance",
    phase: "delivery_readiness",
    category: "outreach_pipeline",
    label: "Unsubscribe link, physical address, delivery verified",
    order: 50,
    critical: true,
  },
  {
    id: "test_sms_e2e",
    phase: "delivery_readiness",
    category: "outreach_pipeline",
    label: "SMS sending tested (compliance, opt-out, time enforcement)",
    order: 51,
    critical: true,
  },
  {
    id: "test_personalization",
    phase: "delivery_readiness",
    category: "outreach_pipeline",
    label: "Claude personalization generating natural messages",
    order: 52,
    critical: true,
  },
  {
    id: "test_followup_fsm",
    phase: "delivery_readiness",
    category: "outreach_pipeline",
    label: "Follow-up state machine tested (stages, opt-out, max attempts)",
    order: 53,
    critical: true,
  },

  // ── Phase 3: Delivery Readiness ── reporting ──
  {
    id: "test_weekly_report",
    phase: "delivery_readiness",
    category: "reporting",
    label: "Weekly report generation tested with dummy data",
    order: 54,
    critical: false,
  },
  {
    id: "test_dashboard",
    phase: "delivery_readiness",
    category: "reporting",
    label: "Dashboard accessible, pipeline displays, metrics show",
    order: 55,
    critical: false,
  },

  // ── Phase 4: Go Live ── final_checks ──
  {
    id: "domain_warmed",
    phase: "go_live",
    category: "final_checks",
    label: "Domain warmed (2+ weeks, 50+ emails)",
    order: 56,
    critical: true,
  },
  {
    id: "all_systems_green",
    phase: "go_live",
    category: "final_checks",
    label: "All systems green on /health",
    order: 57,
    critical: true,
  },
  {
    id: "stripe_accepting",
    phase: "go_live",
    category: "final_checks",
    label: "Stripe accepting payments",
    order: 58,
    critical: true,
  },
  {
    id: "supabase_working",
    phase: "go_live",
    category: "final_checks",
    label: "Supabase storing and retrieving correctly",
    order: 59,
    critical: true,
  },
  {
    id: "discovery_producing",
    phase: "go_live",
    category: "final_checks",
    label: "2+ discovery sources producing leads",
    order: 60,
    critical: true,
  },
  {
    id: "outreach_tested",
    phase: "go_live",
    category: "final_checks",
    label: "Email + SMS outreach tested with compliance",
    order: 61,
    critical: true,
  },
  {
    id: "telegram_working",
    phase: "go_live",
    category: "final_checks",
    label: "Telegram bot receiving alerts and processing commands",
    order: 62,
    critical: true,
  },
  {
    id: "landing_page_live",
    phase: "go_live",
    category: "final_checks",
    label: "Landing page live with working lead capture",
    order: 63,
    critical: true,
  },
  {
    id: "calendly_working",
    phase: "go_live",
    category: "final_checks",
    label: "Scheduling link working",
    order: 64,
    critical: true,
  },
  {
    id: "proposal_ready",
    phase: "go_live",
    category: "final_checks",
    label: "Proposal template ready to generate",
    order: 65,
    critical: true,
  },
  {
    id: "email_sig_configured",
    phase: "go_live",
    category: "final_checks",
    label: "Email signature configured",
    order: 66,
    critical: false,
  },
  {
    id: "linkedin_ready",
    phase: "go_live",
    category: "final_checks",
    label: "LinkedIn profile optimized",
    order: 67,
    critical: false,
  },
  {
    id: "one_pager_ready",
    phase: "go_live",
    category: "final_checks",
    label: "One-pager PDF ready",
    order: 68,
    critical: false,
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const itemById = new Map<string, ChecklistItem>(
  LAUNCH_CHECKLIST.map((item) => [item.id, item])
);

function getItem(id: string): ChecklistItem {
  const item = itemById.get(id);
  if (!item) {
    throw new Error(`Unknown checklist item: ${id}`);
  }
  return item;
}

function itemsForPhase(phase: LaunchPhase): ChecklistItem[] {
  return LAUNCH_CHECKLIST.filter((i) => i.phase === phase);
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

/**
 * Create a fresh checklist state with every item marked incomplete.
 */
export function createLaunchState(): ChecklistState {
  const items: ChecklistState["items"] = {};
  for (const item of LAUNCH_CHECKLIST) {
    items[item.id] = { completed: false };
  }
  return { items, startedAt: new Date() };
}

/**
 * Mark a checklist item as completed and return a new state object.
 *
 * @param state  - Current checklist state.
 * @param itemId - The `id` of the item to complete.
 * @param notes  - Optional freeform notes about completion.
 * @returns A new `ChecklistState` with the item marked complete.
 * @throws If `itemId` does not exist in the checklist.
 */
export function completeItem(
  state: ChecklistState,
  itemId: string,
  notes?: string
): ChecklistState {
  getItem(itemId); // validate
  return {
    ...state,
    items: {
      ...state.items,
      [itemId]: {
        completed: true,
        completedAt: new Date(),
        notes: notes ?? state.items[itemId]?.notes,
      },
    },
  };
}

/**
 * Mark a previously completed item as incomplete and return a new state.
 *
 * @param state  - Current checklist state.
 * @param itemId - The `id` of the item to uncomplete.
 * @returns A new `ChecklistState` with the item marked incomplete.
 * @throws If `itemId` does not exist in the checklist.
 */
export function uncompleteItem(
  state: ChecklistState,
  itemId: string
): ChecklistState {
  getItem(itemId); // validate
  return {
    ...state,
    items: {
      ...state.items,
      [itemId]: {
        completed: false,
        notes: state.items[itemId]?.notes,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Progress queries
// ---------------------------------------------------------------------------

/**
 * Get progress details for a single launch phase.
 *
 * @param state - Current checklist state.
 * @param phase - The phase to inspect.
 * @returns Total count, completed count, percentage, and remaining critical items.
 */
export function getPhaseProgress(
  state: ChecklistState,
  phase: LaunchPhase
): PhaseProgress {
  const phaseItems = itemsForPhase(phase);
  const total = phaseItems.length;
  const completed = phaseItems.filter(
    (i) => state.items[i.id]?.completed
  ).length;
  const criticalRemaining = phaseItems.filter(
    (i) => i.critical && !state.items[i.id]?.completed
  );

  return {
    total,
    completed,
    percentage: total === 0 ? 100 : Math.round((completed / total) * 100),
    criticalRemaining,
  };
}

/**
 * Get progress across all phases, including current phase and launch readiness.
 *
 * @param state - Current checklist state.
 * @returns Overall stats, the earliest incomplete phase, readiness flag, and blockers.
 */
export function getOverallProgress(state: ChecklistState): OverallProgress {
  const total = LAUNCH_CHECKLIST.length;
  const completed = LAUNCH_CHECKLIST.filter(
    (i) => state.items[i.id]?.completed
  ).length;

  const blockers = LAUNCH_CHECKLIST.filter(
    (i) => i.critical && !state.items[i.id]?.completed
  );

  // Current phase is the earliest phase that still has incomplete items.
  let currentPhase: LaunchPhase = "go_live";
  for (const phase of PHASE_ORDER) {
    const progress = getPhaseProgress(state, phase);
    if (progress.completed < progress.total) {
      currentPhase = phase;
      break;
    }
  }

  return {
    total,
    completed,
    percentage: total === 0 ? 100 : Math.round((completed / total) * 100),
    currentPhase,
    readyToLaunch: blockers.length === 0,
    blockers,
  };
}

/**
 * Determine whether all critical items are complete and the platform can launch.
 *
 * @param state - Current checklist state.
 * @returns `ready` boolean and an array of blocker labels if not ready.
 */
export function isReadyToLaunch(state: ChecklistState): {
  ready: boolean;
  blockers: string[];
} {
  const blockers = LAUNCH_CHECKLIST.filter(
    (i) => i.critical && !state.items[i.id]?.completed
  ).map((i) => i.label);

  return { ready: blockers.length === 0, blockers };
}

/**
 * Get the next incomplete items in priority order.
 *
 * Items are sorted by: current phase first, critical before non-critical,
 * then by their original order.
 *
 * @param state - Current checklist state.
 * @param limit - Maximum number of items to return (default 5).
 * @returns Ordered array of the next checklist items to work on.
 */
export function getNextActions(
  state: ChecklistState,
  limit: number = 5
): ChecklistItem[] {
  const { currentPhase } = getOverallProgress(state);
  const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);

  const incomplete = LAUNCH_CHECKLIST.filter(
    (i) => !state.items[i.id]?.completed
  );

  incomplete.sort((a, b) => {
    const aPhaseIdx = PHASE_ORDER.indexOf(a.phase);
    const bPhaseIdx = PHASE_ORDER.indexOf(b.phase);

    // Prioritise current phase
    const aInCurrent = aPhaseIdx === currentPhaseIndex ? 0 : 1;
    const bInCurrent = bPhaseIdx === currentPhaseIndex ? 0 : 1;
    if (aInCurrent !== bInCurrent) return aInCurrent - bInCurrent;

    // Then by phase order
    if (aPhaseIdx !== bPhaseIdx) return aPhaseIdx - bPhaseIdx;

    // Critical first
    if (a.critical !== b.critical) return a.critical ? -1 : 1;

    // Original order
    return a.order - b.order;
  });

  return incomplete.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Build a progress bar string for Telegram (e.g. `[======    ] 60%`).
 */
function progressBar(percentage: number, width: number = 10): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${"=".repeat(filled)}${" ".repeat(empty)}] ${percentage}%`;
}

/**
 * Format the checklist state as a Telegram-friendly summary message.
 *
 * Includes per-phase progress bars, top blockers, and next actions.
 *
 * @param state - Current checklist state.
 * @returns A plain-text string suitable for Telegram messages.
 */
export function formatChecklistForTelegram(state: ChecklistState): string {
  const overall = getOverallProgress(state);
  const lines: string[] = [];

  lines.push("LAUNCH CHECKLIST STATUS");
  lines.push(`Overall: ${progressBar(overall.percentage)}`);
  lines.push(`${overall.completed}/${overall.total} items complete`);
  lines.push("");

  // Per-phase progress
  for (const phase of PHASE_ORDER) {
    const p = getPhaseProgress(state, phase);
    const marker = phase === overall.currentPhase ? " <<" : "";
    lines.push(`${PHASE_LABELS[phase]}: ${progressBar(p.percentage)}${marker}`);
  }
  lines.push("");

  // Blockers
  if (overall.blockers.length > 0) {
    const shown = overall.blockers.slice(0, 5);
    lines.push(`BLOCKERS (${overall.blockers.length} critical remaining):`);
    for (const b of shown) {
      lines.push(`  ! ${b.label}`);
    }
    if (overall.blockers.length > 5) {
      lines.push(`  ... and ${overall.blockers.length - 5} more`);
    }
    lines.push("");
  }

  // Next actions
  const next = getNextActions(state, 3);
  if (next.length > 0) {
    lines.push("NEXT ACTIONS:");
    for (const n of next) {
      const tag = n.critical ? "[CRITICAL]" : "[optional]";
      lines.push(`  > ${n.label} ${tag}`);
    }
    lines.push("");
  }

  // Days remaining
  const daysLeft = getEstimatedDaysRemaining(state);
  lines.push(`Est. days remaining: ~${daysLeft}`);

  if (overall.readyToLaunch) {
    lines.push("");
    lines.push("ALL CRITICAL ITEMS COMPLETE - READY TO LAUNCH");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Estimation
// ---------------------------------------------------------------------------

/**
 * Estimate the number of days remaining based on incomplete phases.
 *
 * Uses phase durations from LAUNCH.md: Phase 0 = 1 day, Phase 1 = 2.5 days,
 * Phase 2 = 1.5 days, Phase 3 = 2.5 days, Phase 4 = 1 day.
 * A partially complete phase contributes a proportional fraction of its duration.
 *
 * @param state - Current checklist state.
 * @returns Estimated number of days remaining (rounded up).
 */
export function getEstimatedDaysRemaining(state: ChecklistState): number {
  let totalDays = 0;

  for (const phase of PHASE_ORDER) {
    const progress = getPhaseProgress(state, phase);
    if (progress.completed >= progress.total) continue;

    const remainingFraction =
      (progress.total - progress.completed) / progress.total;
    totalDays += PHASE_DAYS[phase] * remainingFraction;
  }

  return Math.ceil(totalDays);
}
