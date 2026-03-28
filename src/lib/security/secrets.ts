/**
 * Secret management and rotation tracking for the Sovereign Empire platform.
 *
 * Defines all required secrets, their rotation schedules, and utilities
 * for auditing environment configuration and rotation compliance.
 */

/** How frequently a secret should be rotated. */
export type RotationSchedule = "monthly" | "quarterly" | "on_compromise";

/** Configuration entry for a required secret. */
export interface SecretConfig {
  /** Human-readable name of the secret. */
  name: string;
  /** Environment variable that holds the secret value. */
  envVar: string;
  /** How often this secret should be rotated. */
  rotationSchedule: RotationSchedule;
  /** When the secret was last rotated (if tracked). */
  lastRotated?: Date;
  /** What this secret is used for. */
  description: string;
}

/**
 * All secrets required by the Sovereign Empire platform.
 *
 * Grouped by rotation cadence:
 * - **Monthly**: High-risk API keys and auth tokens.
 * - **Quarterly**: Payment, voice, and infrastructure keys.
 * - **On compromise**: Connection identifiers and stable config.
 */
export const REQUIRED_SECRETS: SecretConfig[] = [
  // Monthly rotation
  {
    name: "Anthropic API Key",
    envVar: "ANTHROPIC_API_KEY",
    rotationSchedule: "monthly",
    description: "Claude API access",
  },
  {
    name: "SMTP Password",
    envVar: "SMTP_PASSWORD",
    rotationSchedule: "monthly",
    description: "Email sending",
  },
  {
    name: "JWT Secret",
    envVar: "JWT_SECRET",
    rotationSchedule: "monthly",
    description: "Dashboard auth tokens",
  },

  // Quarterly rotation
  {
    name: "Stripe Secret Key",
    envVar: "STRIPE_SECRET_KEY",
    rotationSchedule: "quarterly",
    description: "Payment processing",
  },
  {
    name: "Stripe Webhook Secret",
    envVar: "STRIPE_WEBHOOK_SECRET",
    rotationSchedule: "quarterly",
    description: "Webhook verification",
  },
  {
    name: "Twilio Auth Token",
    envVar: "TWILIO_AUTH_TOKEN",
    rotationSchedule: "quarterly",
    description: "SMS/Voice",
  },
  {
    name: "VAPI API Key",
    envVar: "VAPI_API_KEY",
    rotationSchedule: "quarterly",
    description: "Voice AI",
  },
  {
    name: "Google Maps API Key",
    envVar: "GOOGLE_MAPS_API_KEY",
    rotationSchedule: "quarterly",
    description: "Discovery + geocoding",
  },
  {
    name: "Supabase Service Key",
    envVar: "SUPABASE_SERVICE_KEY",
    rotationSchedule: "quarterly",
    description: "Database admin access",
  },
  {
    name: "Encryption Key",
    envVar: "ENCRYPTION_KEY",
    rotationSchedule: "quarterly",
    description: "PII encryption at rest",
  },
  {
    name: "CRON Secret",
    envVar: "CRON_SECRET",
    rotationSchedule: "quarterly",
    description: "Cron auth",
  },

  // On-compromise rotation
  {
    name: "Supabase URL",
    envVar: "SUPABASE_URL",
    rotationSchedule: "on_compromise",
    description: "Database connection",
  },
  {
    name: "Supabase Anon Key",
    envVar: "SUPABASE_ANON_KEY",
    rotationSchedule: "on_compromise",
    description: "Client-facing DB access",
  },
  {
    name: "Twilio Account SID",
    envVar: "TWILIO_ACCOUNT_SID",
    rotationSchedule: "on_compromise",
    description: "Twilio account identifier",
  },
  {
    name: "Twilio Phone Number",
    envVar: "TWILIO_PHONE_NUMBER",
    rotationSchedule: "on_compromise",
    description: "SMS/Voice number",
  },
  {
    name: "Telegram Bot Token",
    envVar: "TELEGRAM_BOT_TOKEN",
    rotationSchedule: "on_compromise",
    description: "Operator bot",
  },
  {
    name: "Operator Chat ID",
    envVar: "OPERATOR_CHAT_ID",
    rotationSchedule: "on_compromise",
    description: "Seth's Telegram",
  },
  {
    name: "SMTP Host",
    envVar: "SMTP_HOST",
    rotationSchedule: "on_compromise",
    description: "Email server",
  },
  {
    name: "SMTP Port",
    envVar: "SMTP_PORT",
    rotationSchedule: "on_compromise",
    description: "Email port",
  },
  {
    name: "SMTP User",
    envVar: "SMTP_USER",
    rotationSchedule: "on_compromise",
    description: "Email username",
  },
];

/** Reasons that trigger immediate secret rotation. */
export type ImmediateRotationReason =
  | "leaked_in_logs"
  | "sent_unencrypted"
  | "access_revoked"
  | "suspicious_usage"
  | "committed_to_git";

/**
 * Standard steps to follow when rotating any secret.
 *
 * This checklist ensures zero-downtime rotation by keeping the old
 * key active until the new one is verified in production.
 */
export const ROTATION_STEPS: string[] = [
  "Generate new key in provider dashboard",
  "Update hosting provider's secrets",
  "Deploy (zero-downtime -- old key still works briefly)",
  "Verify system healthy with new key",
  "Revoke old key in provider dashboard",
  "Log rotation date",
];

// ---------------------------------------------------------------------------
// Rotation schedule thresholds (in milliseconds)
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Maximum age thresholds per rotation schedule. */
const ROTATION_THRESHOLDS: Record<RotationSchedule, number> = {
  monthly: 30 * MS_PER_DAY,
  quarterly: 90 * MS_PER_DAY,
  on_compromise: Infinity, // Only rotated when a compromise event occurs
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check which required secrets are missing from the current environment.
 *
 * @returns An array of {@link SecretConfig} entries whose environment
 *          variables are not set (or are empty strings).
 *
 * @example
 * ```ts
 * const missing = getMissingSecrets();
 * if (missing.length > 0) {
 *   console.error("Missing secrets:", missing.map(s => s.envVar));
 * }
 * ```
 */
export function getMissingSecrets(): SecretConfig[] {
  return REQUIRED_SECRETS.filter((secret) => {
    const value = process.env[secret.envVar];
    return !value || value.trim().length === 0;
  });
}

/**
 * Check which secrets are overdue for rotation based on a rotation log.
 *
 * Compares each secret's last rotation date against its schedule threshold
 * (30 days for monthly, 90 days for quarterly). Secrets with an
 * `on_compromise` schedule are never flagged by this function.
 *
 * @param rotationLog - A map of environment variable names to the date they
 *                      were last rotated. Missing entries are treated as
 *                      "never rotated" and will always be flagged.
 * @returns An array of {@link SecretConfig} entries that need rotation.
 *
 * @example
 * ```ts
 * const log = { ANTHROPIC_API_KEY: new Date("2025-01-15") };
 * const due = getSecretsNeedingRotation(log);
 * ```
 */
export function getSecretsNeedingRotation(
  rotationLog: Record<string, Date>
): SecretConfig[] {
  const now = Date.now();

  return REQUIRED_SECRETS.filter((secret) => {
    const threshold = ROTATION_THRESHOLDS[secret.rotationSchedule];
    if (threshold === Infinity) {
      // on_compromise secrets are not time-based
      return false;
    }

    const lastRotated = rotationLog[secret.envVar];
    if (!lastRotated) {
      // Never rotated -- definitely due
      return true;
    }

    const age = now - new Date(lastRotated).getTime();
    return age > threshold;
  });
}

/**
 * Determine whether a secret should be rotated immediately.
 *
 * All provided reasons (leaked in logs, sent unencrypted, access revoked,
 * suspicious usage, committed to git) are critical security events that
 * require immediate rotation without exception.
 *
 * @param _reason - The reason for potential rotation (unused -- all reasons
 *                  require immediate action).
 * @returns Always `true`.
 *
 * @example
 * ```ts
 * if (requiresImmediateRotation("committed_to_git")) {
 *   // Begin emergency rotation procedure
 * }
 * ```
 */
export function requiresImmediateRotation(
   
  _reason: ImmediateRotationReason
): boolean {
  // Every listed reason is a critical security event.
  return true;
}

/**
 * Mask a secret for safe display in logs or dashboards.
 *
 * Shows the first 4 and last 4 characters with `...` in between.
 * Secrets shorter than 12 characters are fully masked with `****`.
 *
 * @param secret - The raw secret value.
 * @returns A masked version safe for display.
 *
 * @example
 * ```ts
 * maskSecret("sk-ant-api03-abcdef1234567890xyz");
 * // => "sk-a...0xyz"
 * ```
 */
export function maskSecret(secret: string): string {
  if (secret.length < 12) {
    return "****";
  }
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

/**
 * Format the current rotation status of all secrets for a Telegram notification.
 *
 * Produces a human-readable status report with emojis indicating whether
 * each secret is up-to-date, due for rotation, or has never been rotated.
 *
 * @param rotationLog - A map of environment variable names to the date they
 *                      were last rotated.
 * @returns A formatted multi-line string suitable for Telegram messages.
 *
 * @example
 * ```ts
 * const status = formatRotationStatus({ ANTHROPIC_API_KEY: new Date() });
 * await sendTelegramMessage(status);
 * ```
 */
export function formatRotationStatus(
  rotationLog: Record<string, Date>
): string {
  const now = Date.now();
  const lines: string[] = ["Secret Rotation Status", "=".repeat(30)];

  for (const secret of REQUIRED_SECRETS) {
    const lastRotated = rotationLog[secret.envVar];
    const threshold = ROTATION_THRESHOLDS[secret.rotationSchedule];

    let status: string;

    if (threshold === Infinity) {
      status = lastRotated
        ? `OK (rotated ${formatDaysAgo(now, new Date(lastRotated))})`
        : "OK (rotate on compromise only)";
    } else if (!lastRotated) {
      status = "NEVER ROTATED";
    } else {
      const age = now - new Date(lastRotated).getTime();
      const daysAgo = formatDaysAgo(now, new Date(lastRotated));
      if (age > threshold) {
        status = `OVERDUE (last: ${daysAgo})`;
      } else {
        const daysLeft = Math.ceil((threshold - age) / MS_PER_DAY);
        status = `OK (${daysLeft}d until due, last: ${daysAgo})`;
      }
    }

    const isMissing = !process.env[secret.envVar];
    const missingTag = isMissing ? " [MISSING]" : "";
    lines.push(`${secret.name} (${secret.rotationSchedule}): ${status}${missingTag}`);
  }

  const needingRotation = getSecretsNeedingRotation(rotationLog);
  const missing = getMissingSecrets();

  lines.push("");
  lines.push(`Summary: ${needingRotation.length} due for rotation, ${missing.length} missing`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Format the time elapsed since a date as a human-readable string.
 */
function formatDaysAgo(nowMs: number, date: Date): string {
  const days = Math.floor((nowMs - date.getTime()) / MS_PER_DAY);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
