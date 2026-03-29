/**
 * Audit trail utility for tracking administrative and client actions.
 * Pure utility module — no database calls, no side effects.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type AuditCategory =
  | "auth"
  | "client"
  | "admin"
  | "billing"
  | "data"
  | "system";

export type AuditAction =
  // Auth
  | "login"
  | "logout"
  | "password_change"
  | "session_expired"
  // Client
  | "profile_updated"
  | "service_activated"
  | "service_deactivated"
  | "settings_changed"
  // Admin
  | "client_created"
  | "client_deleted"
  | "plan_changed"
  | "impersonation_started"
  // Billing
  | "payment_processed"
  | "refund_issued"
  | "plan_upgraded"
  | "plan_downgraded"
  // Data
  | "export_requested"
  | "import_completed"
  | "deletion_requested"
  // System
  | "cron_executed"
  | "webhook_sent"
  | "email_sent"
  | "api_key_rotated";

export interface AuditEntry {
  readonly id: string;
  readonly timestamp: Date;
  readonly actor: string;
  readonly action: AuditAction;
  readonly category: AuditCategory;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly description: string;
}

export interface AuditFilter {
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly actions?: readonly AuditAction[];
  readonly actors?: readonly string[];
  readonly categories?: readonly AuditCategory[];
}

export interface AuditSummary {
  readonly totalEntries: number;
  readonly byAction: Readonly<Record<string, number>>;
  readonly byCategory: Readonly<Record<string, number>>;
  readonly byActor: Readonly<Record<string, number>>;
  readonly earliestEntry: Date | null;
  readonly latestEntry: Date | null;
  readonly byTimePeriod: Readonly<Record<string, number>>;
}

export interface SuspiciousPattern {
  readonly type: string;
  readonly description: string;
  readonly entries: readonly AuditEntry[];
  readonly severity: "low" | "medium" | "high" | "critical";
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

interface AuditActionDef {
  readonly action: AuditAction;
  readonly category: AuditCategory;
  readonly label: string;
}

export const AUDIT_ACTIONS: readonly AuditActionDef[] = [
  // Auth
  { action: "login", category: "auth", label: "User Login" },
  { action: "logout", category: "auth", label: "User Logout" },
  { action: "password_change", category: "auth", label: "Password Changed" },
  { action: "session_expired", category: "auth", label: "Session Expired" },
  // Client
  { action: "profile_updated", category: "client", label: "Profile Updated" },
  {
    action: "service_activated",
    category: "client",
    label: "Service Activated",
  },
  {
    action: "service_deactivated",
    category: "client",
    label: "Service Deactivated",
  },
  {
    action: "settings_changed",
    category: "client",
    label: "Settings Changed",
  },
  // Admin
  { action: "client_created", category: "admin", label: "Client Created" },
  { action: "client_deleted", category: "admin", label: "Client Deleted" },
  { action: "plan_changed", category: "admin", label: "Plan Changed" },
  {
    action: "impersonation_started",
    category: "admin",
    label: "Impersonation Started",
  },
  // Billing
  {
    action: "payment_processed",
    category: "billing",
    label: "Payment Processed",
  },
  { action: "refund_issued", category: "billing", label: "Refund Issued" },
  { action: "plan_upgraded", category: "billing", label: "Plan Upgraded" },
  { action: "plan_downgraded", category: "billing", label: "Plan Downgraded" },
  // Data
  {
    action: "export_requested",
    category: "data",
    label: "Data Export Requested",
  },
  {
    action: "import_completed",
    category: "data",
    label: "Data Import Completed",
  },
  {
    action: "deletion_requested",
    category: "data",
    label: "Data Deletion Requested",
  },
  // System
  { action: "cron_executed", category: "system", label: "Cron Job Executed" },
  { action: "webhook_sent", category: "system", label: "Webhook Sent" },
  { action: "email_sent", category: "system", label: "Email Sent" },
  {
    action: "api_key_rotated",
    category: "system",
    label: "API Key Rotated",
  },
] as const;

const ACTION_TO_CATEGORY: Readonly<Record<AuditAction, AuditCategory>> =
  Object.fromEntries(
    AUDIT_ACTIONS.map((def) => [def.action, def.category])
  ) as Record<AuditAction, AuditCategory>;

const ACTION_TO_LABEL: Readonly<Record<AuditAction, string>> =
  Object.fromEntries(
    AUDIT_ACTIONS.map((def) => [def.action, def.label])
  ) as Record<AuditAction, string>;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `audit_${timestamp}_${random}`;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

/* ------------------------------------------------------------------ */
/*  createAuditEntry                                                   */
/* ------------------------------------------------------------------ */

interface CreateAuditEntryParams {
  readonly actor: string;
  readonly action: AuditAction;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp?: Date;
}

/**
 * Factory function that creates a fully formed audit entry with
 * auto-generated id, timestamp, and resolved category.
 */
export function createAuditEntry(
  params: CreateAuditEntryParams
): AuditEntry {
  const { actor, action, metadata = {}, timestamp = new Date() } = params;
  const category = ACTION_TO_CATEGORY[action];
  const label = ACTION_TO_LABEL[action];

  return {
    id: generateId(),
    timestamp,
    actor,
    action,
    category,
    metadata: { ...metadata },
    description: `${label} by ${actor}`,
  };
}

/* ------------------------------------------------------------------ */
/*  filterAuditLog                                                     */
/* ------------------------------------------------------------------ */

/**
 * Return entries matching every specified filter criterion.
 * Omitted criteria are treated as "match all."
 */
export function filterAuditLog(
  entries: readonly AuditEntry[],
  filter: AuditFilter
): readonly AuditEntry[] {
  const { startDate, endDate, actions, actors, categories } = filter;

  return entries.filter((entry) => {
    if (startDate && entry.timestamp < startDate) {
      return false;
    }
    if (endDate && entry.timestamp > endDate) {
      return false;
    }
    if (actions && actions.length > 0 && !actions.includes(entry.action)) {
      return false;
    }
    if (actors && actors.length > 0 && !actors.includes(entry.actor)) {
      return false;
    }
    if (
      categories &&
      categories.length > 0 &&
      !categories.includes(entry.category)
    ) {
      return false;
    }
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  summarizeAuditLog                                                  */
/* ------------------------------------------------------------------ */

/**
 * Aggregate counts by action, category, actor, and calendar day.
 */
export function summarizeAuditLog(
  entries: readonly AuditEntry[]
): AuditSummary {
  const byAction: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byActor: Record<string, number> = {};
  const byTimePeriod: Record<string, number> = {};

  let earliestEntry: Date | null = null;
  let latestEntry: Date | null = null;

  for (const entry of entries) {
    byAction[entry.action] = (byAction[entry.action] ?? 0) + 1;
    byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
    byActor[entry.actor] = (byActor[entry.actor] ?? 0) + 1;

    const dateKey = formatDateKey(entry.timestamp);
    byTimePeriod[dateKey] = (byTimePeriod[dateKey] ?? 0) + 1;

    if (earliestEntry === null || entry.timestamp < earliestEntry) {
      earliestEntry = entry.timestamp;
    }
    if (latestEntry === null || entry.timestamp > latestEntry) {
      latestEntry = entry.timestamp;
    }
  }

  return {
    totalEntries: entries.length,
    byAction,
    byCategory,
    byActor,
    earliestEntry,
    latestEntry,
    byTimePeriod,
  };
}

/* ------------------------------------------------------------------ */
/*  formatAuditEntry                                                   */
/* ------------------------------------------------------------------ */

/**
 * Produce a human-readable, single-line description of an audit entry.
 *
 * Example output:
 *   "[2026-03-29 14:05:30] [auth] User Login by admin@co.com"
 */
export function formatAuditEntry(entry: AuditEntry): string {
  const d = entry.timestamp;
  const ts = [
    d.getFullYear(),
    "-",
    padTwo(d.getMonth() + 1),
    "-",
    padTwo(d.getDate()),
    " ",
    padTwo(d.getHours()),
    ":",
    padTwo(d.getMinutes()),
    ":",
    padTwo(d.getSeconds()),
  ].join("");

  const metaKeys = Object.keys(entry.metadata);
  const metaSuffix =
    metaKeys.length > 0
      ? ` | ${metaKeys.map((k) => `${k}=${String(entry.metadata[k])}`).join(", ")}`
      : "";

  return `[${ts}] [${entry.category}] ${entry.description}${metaSuffix}`;
}

/* ------------------------------------------------------------------ */
/*  detectSuspiciousActivity                                           */
/* ------------------------------------------------------------------ */

/** Configurable thresholds for suspicious-activity detection. */
interface DetectionConfig {
  /** Max logins per actor within the rapid-login window. */
  readonly rapidLoginThreshold: number;
  /** Window in milliseconds for rapid-login detection. */
  readonly rapidLoginWindowMs: number;
  /** Max deletion-related actions within the bulk-delete window. */
  readonly bulkDeleteThreshold: number;
  /** Window in milliseconds for bulk-delete detection. */
  readonly bulkDeleteWindowMs: number;
  /** Hour range considered "off-hours" (inclusive start, exclusive end). */
  readonly offHoursStart: number;
  readonly offHoursEnd: number;
}

const DEFAULT_CONFIG: DetectionConfig = {
  rapidLoginThreshold: 5,
  rapidLoginWindowMs: 5 * 60 * 1000, // 5 minutes
  bulkDeleteThreshold: 3,
  bulkDeleteWindowMs: 10 * 60 * 1000, // 10 minutes
  offHoursStart: 22, // 10 PM
  offHoursEnd: 6, // 6 AM
};

const DELETION_ACTIONS: ReadonlySet<AuditAction> = new Set([
  "client_deleted",
  "deletion_requested",
]);

const ADMIN_ACTIONS: ReadonlySet<AuditAction> = new Set([
  "client_created",
  "client_deleted",
  "plan_changed",
  "impersonation_started",
]);

/**
 * Scan an audit log for unusual patterns and return flagged items.
 *
 * Detected patterns:
 * - Rapid logins: many login attempts from one actor in a short window
 * - Bulk deletions: many delete-related actions in a short window
 * - Off-hours admin actions: admin-category actions outside business hours
 */
export function detectSuspiciousActivity(
  entries: readonly AuditEntry[],
  config: Partial<DetectionConfig> = {}
): readonly SuspiciousPattern[] {
  const cfg: DetectionConfig = { ...DEFAULT_CONFIG, ...config };
  const patterns: SuspiciousPattern[] = [];

  // --- Rapid logins ------------------------------------------------
  const loginsByActor = groupByActor(
    entries.filter((e) => e.action === "login")
  );

  for (const [actor, logins] of Object.entries(loginsByActor)) {
    const sorted = sortByTimestamp(logins);
    const windowHits = findWindowBursts(
      sorted,
      cfg.rapidLoginWindowMs,
      cfg.rapidLoginThreshold
    );
    if (windowHits.length > 0) {
      patterns.push({
        type: "rapid_logins",
        description:
          `${windowHits.length} logins from "${actor}" within ` +
          `${cfg.rapidLoginWindowMs / 1000}s window`,
        entries: windowHits,
        severity: "high",
      });
    }
  }

  // --- Bulk deletions ----------------------------------------------
  const deletionEntries = entries.filter((e) =>
    DELETION_ACTIONS.has(e.action)
  );
  const sortedDeletions = sortByTimestamp(deletionEntries);
  const deletionBursts = findWindowBursts(
    sortedDeletions,
    cfg.bulkDeleteWindowMs,
    cfg.bulkDeleteThreshold
  );
  if (deletionBursts.length > 0) {
    patterns.push({
      type: "bulk_deletions",
      description:
        `${deletionBursts.length} deletion actions within ` +
        `${cfg.bulkDeleteWindowMs / 1000}s window`,
      entries: deletionBursts,
      severity: "critical",
    });
  }

  // --- Off-hours admin actions -------------------------------------
  const offHoursAdmin = entries.filter((e) => {
    if (!ADMIN_ACTIONS.has(e.action)) {
      return false;
    }
    const hour = e.timestamp.getHours();
    return isOffHours(hour, cfg.offHoursStart, cfg.offHoursEnd);
  });

  if (offHoursAdmin.length > 0) {
    patterns.push({
      type: "off_hours_admin",
      description:
        `${offHoursAdmin.length} admin action(s) performed outside ` +
        `business hours (${cfg.offHoursStart}:00-${cfg.offHoursEnd}:00)`,
      entries: offHoursAdmin,
      severity: "medium",
    });
  }

  return patterns;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers for detectSuspiciousActivity                      */
/* ------------------------------------------------------------------ */

function groupByActor(
  entries: readonly AuditEntry[]
): Record<string, AuditEntry[]> {
  const groups: Record<string, AuditEntry[]> = {};
  for (const entry of entries) {
    const list = groups[entry.actor] ?? [];
    list.push(entry);
    groups[entry.actor] = list;
  }
  return groups;
}

function sortByTimestamp(
  entries: readonly AuditEntry[]
): readonly AuditEntry[] {
  return [...entries].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
}

/**
 * Sliding-window burst detection.
 * Returns all entries that fall within any window of `windowMs`
 * containing at least `threshold` entries.
 */
function findWindowBursts(
  sorted: readonly AuditEntry[],
  windowMs: number,
  threshold: number
): readonly AuditEntry[] {
  if (sorted.length < threshold) {
    return [];
  }

  const flagged = new Set<string>();
  const result: AuditEntry[] = [];

  for (let i = 0; i <= sorted.length - threshold; i++) {
    const windowEnd =
      sorted[i].timestamp.getTime() + windowMs;
    const windowEntries: AuditEntry[] = [];

    for (let j = i; j < sorted.length; j++) {
      if (sorted[j].timestamp.getTime() <= windowEnd) {
        windowEntries.push(sorted[j]);
      } else {
        break;
      }
    }

    if (windowEntries.length >= threshold) {
      for (const entry of windowEntries) {
        if (!flagged.has(entry.id)) {
          flagged.add(entry.id);
          result.push(entry);
        }
      }
    }
  }

  return result;
}

function isOffHours(
  hour: number,
  start: number,
  end: number
): boolean {
  // Handles ranges that wrap past midnight (e.g. 22-6).
  if (start > end) {
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
}
