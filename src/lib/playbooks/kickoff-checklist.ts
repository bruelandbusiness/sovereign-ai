/**
 * Internal client kickoff checklist from PLAYBOOKS.md.
 * Tracks the setup steps required to bring a new client live.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  category: "setup" | "config" | "outreach" | "launch" | "followup";
  order: number;
  requiresManualAction: boolean;
}

/**
 * The canonical kickoff checklist for onboarding a new contractor client.
 * Each item is tracked per-client in the onboarding flow.
 */
export const KICKOFF_CHECKLIST: ChecklistItem[] = [
  // Setup
  { id: "client_record", label: "Client record created in database", category: "setup", order: 1, requiresManualAction: false },
  { id: "stripe_subscription", label: "Stripe subscription activated", category: "setup", order: 2, requiresManualAction: false },

  // Config
  { id: "service_area", label: "Service area configured (zip codes + cities)", category: "config", order: 3, requiresManualAction: true },
  { id: "vertical_icp", label: "Vertical + ICP configured", category: "config", order: 4, requiresManualAction: true },
  { id: "branding", label: "Branding uploaded (logo, colors, voice notes)", category: "config", order: 5, requiresManualAction: true },
  { id: "discovery_sources", label: "Discovery sources enabled for their market", category: "config", order: 6, requiresManualAction: false },

  // Outreach prep
  { id: "outreach_templates", label: "Outreach templates generated via Claude (review quality)", category: "outreach", order: 7, requiresManualAction: false },
  { id: "email_warmup", label: "Email domain warmed or warmup started", category: "outreach", order: 8, requiresManualAction: false },
  { id: "sms_warmup", label: "SMS number provisioned and warmup started", category: "outreach", order: 9, requiresManualAction: false },

  // Launch
  { id: "dashboard_creds", label: "Dashboard credentials sent", category: "launch", order: 10, requiresManualAction: false },
  { id: "welcome_email", label: "Welcome email sent", category: "launch", order: 11, requiresManualAction: false },
  { id: "first_discovery", label: "First discovery batch run (dry-run for review)", category: "launch", order: 12, requiresManualAction: false },
  { id: "seth_approval", label: "Seth approval via Telegram", category: "launch", order: 13, requiresManualAction: true },
  { id: "system_live", label: "System live — client notified", category: "launch", order: 14, requiresManualAction: true },

  // Follow-up
  { id: "day7_checkin", label: "Day 7 check-in scheduled", category: "followup", order: 15, requiresManualAction: true },
  { id: "day30_review", label: "Day 30 review scheduled", category: "followup", order: 16, requiresManualAction: true },
];

export interface ClientChecklistState {
  clientId: string;
  items: Record<string, { completed: boolean; completedAt?: Date; completedBy?: string }>;
}

/**
 * Create a fresh checklist state for a new client.
 */
export function createChecklistState(clientId: string): ClientChecklistState {
  const items: ClientChecklistState["items"] = {};
  for (const item of KICKOFF_CHECKLIST) {
    items[item.id] = { completed: false };
  }
  return { clientId, items };
}

/**
 * Mark a checklist item as completed.
 */
export function completeChecklistItem(
  state: ClientChecklistState,
  itemId: string,
  completedBy?: string
): ClientChecklistState {
  if (state.items[itemId]) {
    state.items[itemId] = {
      completed: true,
      completedAt: new Date(),
      completedBy,
    };
  }
  return state;
}

/**
 * Get completion progress as a percentage.
 */
export function getChecklistProgress(state: ClientChecklistState): {
  total: number;
  completed: number;
  percentage: number;
  nextItem: ChecklistItem | null;
} {
  const total = KICKOFF_CHECKLIST.length;
  const completed = Object.values(state.items).filter((i) => i.completed).length;
  const nextItem =
    KICKOFF_CHECKLIST.find((item) => !state.items[item.id]?.completed) ?? null;

  return {
    total,
    completed,
    percentage: Math.round((completed / total) * 100),
    nextItem,
  };
}

/**
 * Get all incomplete items that require manual action.
 */
export function getManualActionItems(
  state: ClientChecklistState
): ChecklistItem[] {
  return KICKOFF_CHECKLIST.filter(
    (item) =>
      item.requiresManualAction && !state.items[item.id]?.completed
  );
}
