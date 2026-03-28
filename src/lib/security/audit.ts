/**
 * Security audit checklist and incident response module.
 *
 * Defines monthly audit items, severity classification for security incidents,
 * and a structured data-breach response plan derived from SECURITY.md.
 */

// ---------------------------------------------------------------------------
// Monthly Audit Checklist
// ---------------------------------------------------------------------------

/** Category buckets for audit items. */
export type AuditCategory =
  | "secrets"
  | "dependencies"
  | "auth"
  | "data"
  | "infrastructure"
  | "logging";

/** A single item on the monthly security audit checklist. */
export interface AuditItem {
  id: string;
  category: AuditCategory;
  check: string;
  frequency: "monthly";
  automated: boolean;
  howToVerify: string;
}

/** Full monthly security audit checklist. */
export const MONTHLY_AUDIT_CHECKLIST: AuditItem[] = [
  {
    id: "secrets_valid",
    category: "secrets",
    check: "All API keys still valid and not exposed",
    frequency: "monthly",
    automated: true,
    howToVerify: "Run setup validators for each service",
  },
  {
    id: "env_not_in_git",
    category: "secrets",
    check: ".env not in any git history",
    frequency: "monthly",
    automated: true,
    howToVerify: "git log --all -- .env returns empty",
  },
  {
    id: "dep_audit",
    category: "dependencies",
    check: "No critical vulnerabilities in dependencies",
    frequency: "monthly",
    automated: true,
    howToVerify: "npm audit / pip audit shows no critical",
  },
  {
    id: "webhook_sigs",
    category: "auth",
    check: "All webhook signatures being validated",
    frequency: "monthly",
    automated: false,
    howToVerify: "Review webhook handler code, test with invalid signature",
  },
  {
    id: "rate_limiting",
    category: "auth",
    check: "Rate limiting functioning",
    frequency: "monthly",
    automated: true,
    howToVerify: "Test with burst traffic, verify 429 responses",
  },
  {
    id: "failed_logins",
    category: "auth",
    check: "Failed login attempts reviewed",
    frequency: "monthly",
    automated: false,
    howToVerify: "Check auth logs for brute force patterns",
  },
  {
    id: "data_retention",
    category: "data",
    check: "Data retention policy executing",
    frequency: "monthly",
    automated: true,
    howToVerify: "Check cleanup cron logs, verify old data purged",
  },
  {
    id: "rls_active",
    category: "data",
    check: "RLS policies active on all client-facing tables",
    frequency: "monthly",
    automated: false,
    howToVerify: "Query pg_policies, verify all tables covered",
  },
  {
    id: "https_cert",
    category: "infrastructure",
    check: "HTTPS certificate valid and auto-renewing",
    frequency: "monthly",
    automated: true,
    howToVerify: "Check cert expiry date > 30 days out",
  },
  {
    id: "backup_tested",
    category: "infrastructure",
    check: "Backup restoration tested",
    frequency: "monthly",
    automated: false,
    howToVerify: "Restore from backup to test environment",
  },
  {
    id: "no_pii_in_logs",
    category: "logging",
    check: "No PII in application logs",
    frequency: "monthly",
    automated: false,
    howToVerify: "Grep logs for email/phone patterns",
  },
  {
    id: "token_expiry",
    category: "auth",
    check: "Dashboard auth tokens expiring correctly",
    frequency: "monthly",
    automated: true,
    howToVerify: "Create token, wait for TTL, verify rejected",
  },
  {
    id: "min_permissions",
    category: "infrastructure",
    check: "Third-party integrations using minimum required permissions",
    frequency: "monthly",
    automated: false,
    howToVerify: "Review each integration's scopes/permissions",
  },
];

// ---------------------------------------------------------------------------
// Security Incident Severity
// ---------------------------------------------------------------------------

/** Priority levels for security incidents. */
export type SecuritySeverity = "P1" | "P2" | "P3" | "P4";

/** Describes a security incident severity tier. */
export interface SecurityIncident {
  severity: SecuritySeverity;
  label: string;
  responseTime: string;
  examples: string[];
}

/** Severity tiers with response-time SLAs and example scenarios. */
export const SECURITY_SEVERITY: Record<SecuritySeverity, SecurityIncident> = {
  P1: {
    severity: "P1",
    label: "CRITICAL",
    responseTime: "15 minutes",
    examples: [
      "Confirmed data breach (PII exposed)",
      "API key leaked publicly",
      "Unauthorized access to client data",
      "Stripe/payment system compromise",
    ],
  },
  P2: {
    severity: "P2",
    label: "HIGH",
    responseTime: "1 hour",
    examples: [
      "Brute force login attempts at scale",
      "Unexpected data access patterns",
      "Dependency vulnerability with known exploit",
      "Webhook signature failures at scale",
    ],
  },
  P3: {
    severity: "P3",
    label: "MEDIUM",
    responseTime: "24 hours",
    examples: [
      "Single suspicious login attempt",
      "New dependency vulnerability (no known exploit)",
      "Minor misconfiguration found in audit",
    ],
  },
  P4: {
    severity: "P4",
    label: "LOW",
    responseTime: "1 week",
    examples: [
      "Security improvement opportunity",
      "Best practice not yet implemented",
      "Deprecated dependency version",
    ],
  },
};

// ---------------------------------------------------------------------------
// Data Breach Response Plan
// ---------------------------------------------------------------------------

/** A single phase in the breach response plan. */
export interface BreachResponsePhase {
  phase: string;
  timeframe: string;
  steps: string[];
}

/** Structured data-breach response plan. */
export const BREACH_RESPONSE_PLAN: BreachResponsePhase[] = [
  {
    phase: "Immediate",
    timeframe: "Hour 1",
    steps: [
      "Contain: Identify what's exposed, how, and stop the leak",
      "Rotate: All API keys, tokens, and secrets immediately",
      "Assess: What data, which clients, how many records",
      "Alert: Notify Seth via Telegram CRITICAL",
    ],
  },
  {
    phase: "Response",
    timeframe: "Hour 2-24",
    steps: [
      "Document: Full timeline of what happened",
      "Notify: Affected clients within 24 hours",
      "Notify: Arizona AG if >1,000 residents affected (ARS 18-552)",
      "Remediate: Fix the vulnerability that caused the breach",
      "Monitor: Watch for exploitation of exposed data",
    ],
  },
  {
    phase: "Post-Incident",
    timeframe: "After resolution",
    steps: [
      "Root cause analysis",
      "Update security practices to prevent recurrence",
      "Document lessons learned in docs/incidents/",
    ],
  },
];

// ---------------------------------------------------------------------------
// Keyword sets used by classifySecurityEvent
// ---------------------------------------------------------------------------

const P1_KEYWORDS = ["breach", "leaked", "unauthorized", "compromise", "exposed"];
const P2_KEYWORDS = ["brute force", "exploit", "unexpected access", "signature failure"];
const P3_KEYWORDS = ["suspicious", "misconfiguration", "vulnerability"];
const P4_KEYWORDS = ["improvement", "deprecated", "best practice"];

// ---------------------------------------------------------------------------
// Helper: parse a human-readable response time into milliseconds
// ---------------------------------------------------------------------------

function responseTimeToMs(responseTime: string): number {
  const match = responseTime.match(/^(\d+)\s*(minute|hour|day|week)s?$/i);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "minute":
      return value * 60 * 1000;
    case "hour":
      return value * 60 * 60 * 1000;
    case "day":
      return value * 24 * 60 * 60 * 1000;
    case "week":
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/** Returns the full monthly audit checklist. */
export function getAuditChecklist(): AuditItem[] {
  return MONTHLY_AUDIT_CHECKLIST;
}

/** Returns only the audit items that can be verified automatically. */
export function getAutomatedChecks(): AuditItem[] {
  return MONTHLY_AUDIT_CHECKLIST.filter((item) => item.automated);
}

/**
 * Classify a security event description into a severity level using keyword
 * matching. Falls back to P3 if no keywords match.
 *
 * @param description - Free-text description of the security event.
 * @returns The assigned {@link SecuritySeverity}.
 */
export function classifySecurityEvent(description: string): SecuritySeverity {
  const lower = description.toLowerCase();

  if (P1_KEYWORDS.some((kw) => lower.includes(kw))) return "P1";
  if (P2_KEYWORDS.some((kw) => lower.includes(kw))) return "P2";
  if (P3_KEYWORDS.some((kw) => lower.includes(kw))) return "P3";
  if (P4_KEYWORDS.some((kw) => lower.includes(kw))) return "P4";

  // Default to MEDIUM when no keywords matched
  return "P3";
}

/**
 * Calculate the deadline by which a security incident must be responded to,
 * based on its severity and the time it was detected.
 *
 * @param severity - The incident severity level.
 * @param detectedAt - When the incident was first detected.
 * @returns A {@link Date} representing the response deadline.
 */
export function getResponseDeadline(severity: SecuritySeverity, detectedAt: Date): Date {
  const incident = SECURITY_SEVERITY[severity];
  const ms = responseTimeToMs(incident.responseTime);
  return new Date(detectedAt.getTime() + ms);
}

/**
 * Format a Telegram alert message for a data breach event.
 *
 * @param affectedClients - Number of clients whose data may be affected.
 * @param dataTypes - Categories of data involved (e.g., "email", "phone").
 * @param source - How or where the breach originated.
 * @returns A pre-formatted Telegram alert string.
 */
export function formatBreachAlert(
  affectedClients: number,
  dataTypes: string[],
  source: string,
): string {
  const lines: string[] = [
    "CRITICAL SECURITY ALERT",
    "",
    `Affected clients: ${affectedClients}`,
    `Data types: ${dataTypes.join(", ")}`,
    `Source: ${source}`,
    "",
    "Immediate actions required:",
    ...BREACH_RESPONSE_PLAN[0].steps.map((s) => `  - ${s}`),
  ];
  return lines.join("\n");
}

/**
 * Determine whether a data breach requires notification to a state Attorney
 * General based on the number of affected residents and the state.
 *
 * Currently only Arizona's threshold (1,000 residents per ARS 18-552) is
 * implemented. Other states default to `false`.
 *
 * @param affectedResidents - Number of state residents affected.
 * @param state - US state (case-insensitive; accepts "AZ" or "Arizona").
 * @returns `true` if AG notification is required.
 */
export function requiresAGNotification(affectedResidents: number, state: string): boolean {
  const normalized = state.trim().toLowerCase();
  if (normalized === "az" || normalized === "arizona") {
    return affectedResidents > 1000;
  }
  return false;
}
