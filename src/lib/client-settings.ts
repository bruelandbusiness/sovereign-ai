/**
 * Pure utility functions for managing client dashboard settings/preferences.
 *
 * No database calls — all functions operate on plain objects.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported notification channels. */
export type NotificationChannel = "email" | "sms" | "push" | "in_app";

/** How often digest emails are sent. */
export type EmailFrequency = "realtime" | "daily" | "weekly" | "monthly" | "none";

/** Supported dashboard languages (ISO 639-1). */
export type Language = "en" | "es" | "fr" | "de" | "pt" | "ja" | "zh" | "ko";

/** Named dashboard layout presets. */
export type DashboardLayout = "default" | "compact" | "expanded" | "minimal";

/** Per-channel notification preferences. */
export interface NotificationPreferences {
  readonly channels: readonly NotificationChannel[];
  readonly mutedUntil: string | null;
  readonly quietHoursStart: string | null;
  readonly quietHoursEnd: string | null;
}

/** Complete client settings object. */
export interface ClientSettings {
  readonly notifications: NotificationPreferences;
  readonly timezone: string;
  readonly language: Language;
  readonly dashboardLayout: DashboardLayout;
  readonly emailFrequency: EmailFrequency;
}

/** Recursive partial variant for merge operations. */
export type PartialClientSettings = {
  readonly [K in keyof ClientSettings]?: ClientSettings[K] extends object
    ? Partial<ClientSettings[K]>
    : ClientSettings[K];
};

/** A single validation error. */
export interface SettingsValidationError {
  readonly field: string;
  readonly message: string;
}

/** A single changed field between two settings objects. */
export interface SettingsChange {
  readonly field: string;
  readonly from: unknown;
  readonly to: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_CHANNELS: readonly NotificationChannel[] = [
  "email",
  "sms",
  "push",
  "in_app",
] as const;

const VALID_EMAIL_FREQUENCIES: readonly EmailFrequency[] = [
  "realtime",
  "daily",
  "weekly",
  "monthly",
  "none",
] as const;

const VALID_LANGUAGES: readonly Language[] = [
  "en",
  "es",
  "fr",
  "de",
  "pt",
  "ja",
  "zh",
  "ko",
] as const;

const VALID_LAYOUTS: readonly DashboardLayout[] = [
  "default",
  "compact",
  "expanded",
  "minimal",
] as const;

/** ISO 8601 24-hour time pattern (HH:MM). */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** IANA timezone pattern (rough check). */
const TIMEZONE_PATTERN = /^[A-Za-z_]+\/[A-Za-z_]+$/;

/** Default settings applied to every new client. */
export const DEFAULT_CLIENT_SETTINGS: ClientSettings = {
  notifications: {
    channels: ["email", "in_app"],
    mutedUntil: null,
    quietHoursStart: null,
    quietHoursEnd: null,
  },
  timezone: "America/New_York",
  language: "en",
  dashboardLayout: "default",
  emailFrequency: "daily",
} as const;

// ---------------------------------------------------------------------------
// mergeWithDefaults
// ---------------------------------------------------------------------------

/**
 * Merge a partial settings object with defaults, returning a complete
 * `ClientSettings`. Nested objects are shallow-merged one level deep.
 *
 * The original `defaults` and `overrides` are never mutated.
 */
export function mergeWithDefaults(
  overrides: PartialClientSettings,
  defaults: ClientSettings = DEFAULT_CLIENT_SETTINGS,
): ClientSettings {
  const mergedNotifications: NotificationPreferences = {
    ...defaults.notifications,
    ...(overrides.notifications ?? {}),
  };

  return {
    notifications: mergedNotifications,
    timezone: overrides.timezone ?? defaults.timezone,
    language: overrides.language ?? defaults.language,
    dashboardLayout: overrides.dashboardLayout ?? defaults.dashboardLayout,
    emailFrequency: overrides.emailFrequency ?? defaults.emailFrequency,
  };
}

// ---------------------------------------------------------------------------
// validateSettings
// ---------------------------------------------------------------------------

/**
 * Validate a `ClientSettings` object and return an array of errors.
 * An empty array means the settings are valid.
 */
export function validateSettings(
  settings: ClientSettings,
): readonly SettingsValidationError[] {
  const errors: SettingsValidationError[] = [];

  // --- notifications.channels ---
  if (!Array.isArray(settings.notifications.channels)) {
    errors.push({
      field: "notifications.channels",
      message: "channels must be an array",
    });
  } else {
    if (settings.notifications.channels.length === 0) {
      errors.push({
        field: "notifications.channels",
        message: "At least one notification channel is required",
      });
    }
    for (const ch of settings.notifications.channels) {
      if (!VALID_CHANNELS.includes(ch as NotificationChannel)) {
        errors.push({
          field: "notifications.channels",
          message: `Invalid channel: "${String(ch)}"`,
        });
      }
    }
    const unique = new Set(settings.notifications.channels);
    if (unique.size !== settings.notifications.channels.length) {
      errors.push({
        field: "notifications.channels",
        message: "Duplicate channels are not allowed",
      });
    }
  }

  // --- notifications.mutedUntil ---
  if (settings.notifications.mutedUntil !== null) {
    const parsed = Date.parse(settings.notifications.mutedUntil);
    if (Number.isNaN(parsed)) {
      errors.push({
        field: "notifications.mutedUntil",
        message: "mutedUntil must be a valid ISO 8601 date string or null",
      });
    }
  }

  // --- notifications.quietHoursStart / quietHoursEnd ---
  const { quietHoursStart, quietHoursEnd } = settings.notifications;
  if (quietHoursStart !== null && !TIME_PATTERN.test(quietHoursStart)) {
    errors.push({
      field: "notifications.quietHoursStart",
      message: "quietHoursStart must be in HH:MM format or null",
    });
  }
  if (quietHoursEnd !== null && !TIME_PATTERN.test(quietHoursEnd)) {
    errors.push({
      field: "notifications.quietHoursEnd",
      message: "quietHoursEnd must be in HH:MM format or null",
    });
  }
  if (
    (quietHoursStart === null) !== (quietHoursEnd === null)
  ) {
    errors.push({
      field: "notifications.quietHoursStart",
      message:
        "quietHoursStart and quietHoursEnd must both be set or both be null",
    });
  }

  // --- timezone ---
  if (
    typeof settings.timezone !== "string" ||
    !TIMEZONE_PATTERN.test(settings.timezone)
  ) {
    errors.push({
      field: "timezone",
      message:
        "timezone must be a valid IANA timezone (e.g. America/New_York)",
    });
  }

  // --- language ---
  if (!VALID_LANGUAGES.includes(settings.language)) {
    errors.push({
      field: "language",
      message: `Invalid language: "${String(settings.language)}"`,
    });
  }

  // --- dashboardLayout ---
  if (!VALID_LAYOUTS.includes(settings.dashboardLayout)) {
    errors.push({
      field: "dashboardLayout",
      message: `Invalid dashboard layout: "${String(settings.dashboardLayout)}"`,
    });
  }

  // --- emailFrequency ---
  if (!VALID_EMAIL_FREQUENCIES.includes(settings.emailFrequency)) {
    errors.push({
      field: "emailFrequency",
      message: `Invalid email frequency: "${String(settings.emailFrequency)}"`,
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// settingsDiff
// ---------------------------------------------------------------------------

/**
 * Compare two settings objects and return an array of changed fields.
 * An empty array means the settings are identical.
 */
export function settingsDiff(
  previous: ClientSettings,
  current: ClientSettings,
): readonly SettingsChange[] {
  const changes: SettingsChange[] = [];

  // --- top-level scalars ---
  const scalarKeys = [
    "timezone",
    "language",
    "dashboardLayout",
    "emailFrequency",
  ] as const;

  for (const key of scalarKeys) {
    if (previous[key] !== current[key]) {
      changes.push({ field: key, from: previous[key], to: current[key] });
    }
  }

  // --- notifications (compare each sub-field) ---
  const prevN = previous.notifications;
  const currN = current.notifications;

  const channelsSorted = (ch: readonly NotificationChannel[]) =>
    [...ch].sort().join(",");

  if (channelsSorted(prevN.channels) !== channelsSorted(currN.channels)) {
    changes.push({
      field: "notifications.channels",
      from: prevN.channels,
      to: currN.channels,
    });
  }

  if (prevN.mutedUntil !== currN.mutedUntil) {
    changes.push({
      field: "notifications.mutedUntil",
      from: prevN.mutedUntil,
      to: currN.mutedUntil,
    });
  }

  if (prevN.quietHoursStart !== currN.quietHoursStart) {
    changes.push({
      field: "notifications.quietHoursStart",
      from: prevN.quietHoursStart,
      to: currN.quietHoursStart,
    });
  }

  if (prevN.quietHoursEnd !== currN.quietHoursEnd) {
    changes.push({
      field: "notifications.quietHoursEnd",
      from: prevN.quietHoursEnd,
      to: currN.quietHoursEnd,
    });
  }

  return changes;
}

// ---------------------------------------------------------------------------
// formatSettingSummary
// ---------------------------------------------------------------------------

/** Labels for email frequency values. */
const EMAIL_FREQUENCY_LABELS: Record<EmailFrequency, string> = {
  realtime: "Real-time",
  daily: "Daily digest",
  weekly: "Weekly digest",
  monthly: "Monthly digest",
  none: "Disabled",
};

/** Labels for dashboard layout values. */
const LAYOUT_LABELS: Record<DashboardLayout, string> = {
  default: "Default",
  compact: "Compact",
  expanded: "Expanded",
  minimal: "Minimal",
};

/**
 * Return a human-readable summary of the current settings.
 * Useful for confirmation screens or audit logs.
 */
export function formatSettingSummary(settings: ClientSettings): string {
  const lines: string[] = [];

  lines.push(
    `Notifications: ${settings.notifications.channels.join(", ")}`,
  );

  if (settings.notifications.mutedUntil) {
    lines.push(`  Muted until: ${settings.notifications.mutedUntil}`);
  }

  if (
    settings.notifications.quietHoursStart &&
    settings.notifications.quietHoursEnd
  ) {
    lines.push(
      `  Quiet hours: ${settings.notifications.quietHoursStart} - ${settings.notifications.quietHoursEnd}`,
    );
  }

  lines.push(`Timezone: ${settings.timezone}`);
  lines.push(`Language: ${settings.language.toUpperCase()}`);
  lines.push(`Layout: ${LAYOUT_LABELS[settings.dashboardLayout]}`);
  lines.push(
    `Email frequency: ${EMAIL_FREQUENCY_LABELS[settings.emailFrequency]}`,
  );

  return lines.join("\n");
}
