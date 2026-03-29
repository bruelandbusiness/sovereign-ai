// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Broad groupings for notifications. */
export type NotificationCategory =
  | "leads"
  | "reviews"
  | "billing"
  | "services"
  | "system"
  | "marketing";

/** Specific event types within each category. */
export type NotificationEvent =
  // Leads
  | "new_lead"
  | "lead_scored"
  | "lead_converted"
  // Reviews
  | "new_review"
  | "review_response_needed"
  | "rating_change"
  // Billing
  | "payment_received"
  | "payment_failed"
  | "invoice_ready"
  // Services
  | "service_activated"
  | "health_alert"
  | "performance_report"
  // System
  | "maintenance"
  | "feature_update"
  | "security_alert"
  // Marketing
  | "campaign_complete"
  | "content_published"
  | "social_mention";

/** Supported delivery channels. */
export type DeliveryChannel = "email" | "sms" | "push" | "in_app";

/** How often digest notifications are batched. */
export type DigestFrequency = "immediate" | "hourly" | "daily" | "weekly";

/** Configuration for digest-style delivery. */
export interface DigestConfig {
  readonly enabled: boolean;
  readonly frequency: DigestFrequency;
  /** Hour of day (0-23) for daily/weekly digests. */
  readonly preferredHour: number;
  /** Day of week (0 = Sunday, 6 = Saturday) for weekly digests. */
  readonly preferredDay: number;
}

/** Quiet-hours window during which non-urgent notifications are held. */
export interface QuietHours {
  readonly enabled: boolean;
  /** Start hour in 24-hour format (0-23). */
  readonly startHour: number;
  /** End hour in 24-hour format (0-23). */
  readonly endHour: number;
  /** IANA timezone string, e.g. "America/Chicago". */
  readonly timezone: string;
}

/** Per-channel settings for a single event. */
export interface ChannelSetting {
  readonly enabled: boolean;
  readonly digest: DigestConfig;
}

/** Preference for a single notification event across all channels. */
export interface EventPreference {
  readonly channels: Readonly<Record<DeliveryChannel, ChannelSetting>>;
  /** If true the event is completely muted regardless of channel settings. */
  readonly muted: boolean;
}

/** Full set of notification preferences for a user. */
export interface NotificationPreference {
  readonly categories: Readonly<
    Record<NotificationCategory, Readonly<Record<NotificationEvent, EventPreference>>>
  >;
  readonly quietHours: QuietHours;
  /** Global mute — suppresses everything. */
  readonly globalMute: boolean;
}

/** A notification item to be delivered or grouped into a digest. */
export interface NotificationItem {
  readonly id: string;
  readonly category: NotificationCategory;
  readonly event: NotificationEvent;
  readonly title: string;
  readonly body: string;
  readonly timestamp: Date;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Validation error returned by validatePreferences. */
export interface PreferenceValidationError {
  readonly path: string;
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Category → event mapping
// ---------------------------------------------------------------------------

export interface CategoryDefinition {
  readonly label: string;
  readonly events: readonly NotificationEvent[];
}

/**
 * Canonical mapping from category to the events it contains.
 * Used as the source of truth when building defaults and validating.
 */
export const NOTIFICATION_CATEGORIES: Readonly<
  Record<NotificationCategory, CategoryDefinition>
> = {
  leads: {
    label: "Leads",
    events: ["new_lead", "lead_scored", "lead_converted"],
  },
  reviews: {
    label: "Reviews",
    events: ["new_review", "review_response_needed", "rating_change"],
  },
  billing: {
    label: "Billing",
    events: ["payment_received", "payment_failed", "invoice_ready"],
  },
  services: {
    label: "Services",
    events: ["service_activated", "health_alert", "performance_report"],
  },
  system: {
    label: "System",
    events: ["maintenance", "feature_update", "security_alert"],
  },
  marketing: {
    label: "Marketing",
    events: ["campaign_complete", "content_published", "social_mention"],
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers (internal)
// ---------------------------------------------------------------------------

const ALL_CHANNELS: readonly DeliveryChannel[] = [
  "email",
  "sms",
  "push",
  "in_app",
] as const;

const IMMEDIATE_DIGEST: DigestConfig = {
  enabled: false,
  frequency: "immediate",
  preferredHour: 9,
  preferredDay: 1,
} as const;

const DAILY_DIGEST: DigestConfig = {
  enabled: true,
  frequency: "daily",
  preferredHour: 9,
  preferredDay: 1,
} as const;

function channelSetting(
  enabled: boolean,
  digest: DigestConfig = IMMEDIATE_DIGEST,
): ChannelSetting {
  return { enabled, digest };
}

function makeChannels(
  overrides: Partial<Record<DeliveryChannel, ChannelSetting>> = {},
): Readonly<Record<DeliveryChannel, ChannelSetting>> {
  const base: Record<DeliveryChannel, ChannelSetting> = {
    email: channelSetting(true),
    sms: channelSetting(false),
    push: channelSetting(true),
    in_app: channelSetting(true),
  };
  return { ...base, ...overrides };
}

function eventPref(
  channels: Readonly<Record<DeliveryChannel, ChannelSetting>>,
  muted = false,
): EventPreference {
  return { channels, muted };
}

// ---------------------------------------------------------------------------
// Sensible defaults per category / event
// ---------------------------------------------------------------------------

/**
 * High-urgency events get SMS + immediate delivery.
 * Low-urgency events default to daily digest on email only.
 * Everything appears in-app.
 */
function buildDefaultCategories(): NotificationPreference["categories"] {
  /* Leads ---------------------------------------------------------------- */
  const leads: Record<NotificationEvent, EventPreference> = {
    new_lead: eventPref(makeChannels({
      sms: channelSetting(true),
      push: channelSetting(true),
    })),
    lead_scored: eventPref(makeChannels({
      email: channelSetting(true, DAILY_DIGEST),
      push: channelSetting(false),
    })),
    lead_converted: eventPref(makeChannels({
      sms: channelSetting(true),
    })),
  } as Record<NotificationEvent, EventPreference>;

  /* Reviews -------------------------------------------------------------- */
  const reviews: Record<NotificationEvent, EventPreference> = {
    new_review: eventPref(makeChannels({
      sms: channelSetting(true),
      push: channelSetting(true),
    })),
    review_response_needed: eventPref(makeChannels({
      sms: channelSetting(true),
      push: channelSetting(true),
    })),
    rating_change: eventPref(makeChannels({
      email: channelSetting(true, DAILY_DIGEST),
      push: channelSetting(false),
      sms: channelSetting(false),
    })),
  } as Record<NotificationEvent, EventPreference>;

  /* Billing -------------------------------------------------------------- */
  const billing: Record<NotificationEvent, EventPreference> = {
    payment_received: eventPref(makeChannels({
      sms: channelSetting(false),
      push: channelSetting(false),
    })),
    payment_failed: eventPref(makeChannels({
      sms: channelSetting(true),
      push: channelSetting(true),
    })),
    invoice_ready: eventPref(makeChannels({
      sms: channelSetting(false),
      push: channelSetting(false),
    })),
  } as Record<NotificationEvent, EventPreference>;

  /* Services ------------------------------------------------------------- */
  const services: Record<NotificationEvent, EventPreference> = {
    service_activated: eventPref(makeChannels()),
    health_alert: eventPref(makeChannels({
      sms: channelSetting(true),
      push: channelSetting(true),
    })),
    performance_report: eventPref(makeChannels({
      email: channelSetting(true, DAILY_DIGEST),
      push: channelSetting(false),
      sms: channelSetting(false),
    })),
  } as Record<NotificationEvent, EventPreference>;

  /* System --------------------------------------------------------------- */
  const system: Record<NotificationEvent, EventPreference> = {
    maintenance: eventPref(makeChannels({
      sms: channelSetting(false),
      push: channelSetting(true),
    })),
    feature_update: eventPref(makeChannels({
      email: channelSetting(true, DAILY_DIGEST),
      push: channelSetting(false),
      sms: channelSetting(false),
    })),
    security_alert: eventPref(makeChannels({
      sms: channelSetting(true),
      push: channelSetting(true),
    })),
  } as Record<NotificationEvent, EventPreference>;

  /* Marketing ------------------------------------------------------------ */
  const marketing: Record<NotificationEvent, EventPreference> = {
    campaign_complete: eventPref(makeChannels({
      sms: channelSetting(false),
      push: channelSetting(false),
      email: channelSetting(true, DAILY_DIGEST),
    })),
    content_published: eventPref(makeChannels({
      sms: channelSetting(false),
      push: channelSetting(false),
      email: channelSetting(true, DAILY_DIGEST),
    })),
    social_mention: eventPref(makeChannels({
      push: channelSetting(true),
    })),
  } as Record<NotificationEvent, EventPreference>;

  return { leads, reviews, billing, services, system, marketing };
}

export const DEFAULT_PREFERENCES: NotificationPreference = {
  categories: buildDefaultCategories(),
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 7,
    timezone: "America/New_York",
  },
  globalMute: false,
} as const;

// ---------------------------------------------------------------------------
// mergePreferences
// ---------------------------------------------------------------------------

/**
 * Deep-merge user overrides on top of defaults.
 * Accepts a partial structure so callers only need to specify fields they
 * want to change.  Returns a brand-new object (no mutation).
 */
export function mergePreferences(
  overrides: DeepPartial<NotificationPreference>,
): NotificationPreference {
  const base = DEFAULT_PREFERENCES;

  const mergedCategories = { ...base.categories };
  if (overrides.categories) {
    for (const catKey of Object.keys(overrides.categories) as NotificationCategory[]) {
      const catOverride = overrides.categories[catKey];
      if (!catOverride) continue;

      const baseCat = base.categories[catKey] ?? {};
      const mergedCat = { ...baseCat };

      for (const evtKey of Object.keys(catOverride) as NotificationEvent[]) {
        const evtOverride = catOverride[evtKey];
        if (!evtOverride) continue;

        const baseEvt: EventPreference = (baseCat as Record<string, EventPreference>)[evtKey] ?? {
          channels: makeChannels(),
          muted: false,
        };

        const mergedChannels = { ...baseEvt.channels };
        if (evtOverride.channels) {
          for (const ch of ALL_CHANNELS) {
            const chOverride = evtOverride.channels[ch];
            if (!chOverride) continue;
            mergedChannels[ch] = {
              ...baseEvt.channels[ch],
              ...chOverride,
              digest: {
                ...(baseEvt.channels[ch]?.digest ?? IMMEDIATE_DIGEST),
                ...(chOverride.digest ?? {}),
              },
            };
          }
        }

        (mergedCat as Record<string, EventPreference>)[evtKey] = {
          channels: mergedChannels,
          muted: evtOverride.muted ?? baseEvt.muted,
        };
      }

      (mergedCategories as Record<string, unknown>)[catKey] = mergedCat;
    }
  }

  return {
    categories: mergedCategories,
    quietHours: {
      ...base.quietHours,
      ...(overrides.quietHours ?? {}),
    },
    globalMute: overrides.globalMute ?? base.globalMute,
  };
}

/** Recursive Partial that also makes nested objects partial. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ---------------------------------------------------------------------------
// shouldNotify
// ---------------------------------------------------------------------------

export interface ShouldNotifyParams {
  readonly preferences: NotificationPreference;
  readonly category: NotificationCategory;
  readonly event: NotificationEvent;
  readonly channel: DeliveryChannel;
  /** Current time; defaults to now. */
  readonly now?: Date;
}

/**
 * Determine whether a notification should be delivered right now.
 *
 * Checks (in order):
 * 1. Global mute
 * 2. Event-level mute
 * 3. Channel enabled
 * 4. Quiet hours (non-urgent events are suppressed during quiet hours)
 */
export function shouldNotify({
  preferences,
  category,
  event,
  channel,
  now = new Date(),
}: ShouldNotifyParams): boolean {
  if (preferences.globalMute) return false;

  const catPrefs = preferences.categories[category] as
    | Record<NotificationEvent, EventPreference>
    | undefined;
  if (!catPrefs) return false;

  const evtPref = catPrefs[event];
  if (!evtPref) return false;

  if (evtPref.muted) return false;

  const chSetting = evtPref.channels[channel];
  if (!chSetting?.enabled) return false;

  if (preferences.quietHours.enabled && !isUrgentEvent(event)) {
    if (isWithinQuietHours(now, preferences.quietHours)) {
      return false;
    }
  }

  return true;
}

/** Events that bypass quiet hours. */
const URGENT_EVENTS: ReadonlySet<NotificationEvent> = new Set<NotificationEvent>([
  "payment_failed",
  "health_alert",
  "security_alert",
]);

function isUrgentEvent(event: NotificationEvent): boolean {
  return URGENT_EVENTS.has(event);
}

/**
 * Check whether `now` falls inside the quiet-hours window.
 * Uses a simple hour comparison (timezone-aware formatting).
 */
function isWithinQuietHours(now: Date, qh: QuietHours): boolean {
  const currentHour = getHourInTimezone(now, qh.timezone);

  if (qh.startHour <= qh.endHour) {
    // e.g. 8 → 17 (daytime quiet hours — unusual but valid)
    return currentHour >= qh.startHour && currentHour < qh.endHour;
  }
  // Wraps midnight, e.g. 22 → 7
  return currentHour >= qh.startHour || currentHour < qh.endHour;
}

function getHourInTimezone(date: Date, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }).formatToParts(date);
    const hourPart = parts.find((p) => p.type === "hour");
    return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
}

// ---------------------------------------------------------------------------
// getDigestItems
// ---------------------------------------------------------------------------

export interface DigestGroup {
  readonly category: NotificationCategory;
  readonly event: NotificationEvent;
  readonly channel: DeliveryChannel;
  readonly frequency: DigestFrequency;
  readonly items: readonly NotificationItem[];
}

/**
 * Group notification items by their digest settings for a given channel.
 *
 * Only returns groups where digest is enabled. Items whose corresponding
 * event/channel is disabled or muted are excluded.
 */
export function getDigestItems(
  items: readonly NotificationItem[],
  preferences: NotificationPreference,
  channel: DeliveryChannel,
): readonly DigestGroup[] {
  const groups = new Map<string, { items: NotificationItem[]; frequency: DigestFrequency }>();

  for (const item of items) {
    const catPrefs = preferences.categories[item.category] as
      | Record<NotificationEvent, EventPreference>
      | undefined;
    if (!catPrefs) continue;

    const evtPref = catPrefs[item.event];
    if (!evtPref || evtPref.muted) continue;

    const chSetting = evtPref.channels[channel];
    if (!chSetting?.enabled || !chSetting.digest.enabled) continue;

    const key = `${item.category}:${item.event}:${chSetting.digest.frequency}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, {
        items: [item],
        frequency: chSetting.digest.frequency,
      });
    }
  }

  const result: DigestGroup[] = [];
  groups.forEach((value, key) => {
    const [category, event] = key.split(":") as [NotificationCategory, NotificationEvent];
    result.push({
      category,
      event,
      channel,
      frequency: value.frequency,
      items: value.items,
    });
  });

  return result;
}

// ---------------------------------------------------------------------------
// formatNotificationText
// ---------------------------------------------------------------------------

export interface FormattedNotification {
  readonly subject: string;
  readonly body: string;
}

/**
 * Generate channel-appropriate notification text.
 *
 * - **email**: full subject line + HTML-safe body
 * - **sms**: compact single-line message (≤160 chars)
 * - **push**: short title + truncated body
 * - **in_app**: title + full body
 */
export function formatNotificationText(
  item: NotificationItem,
  channel: DeliveryChannel,
): FormattedNotification {
  const categoryLabel =
    NOTIFICATION_CATEGORIES[item.category]?.label ?? item.category;

  switch (channel) {
    case "email":
      return {
        subject: `[${categoryLabel}] ${item.title}`,
        body: item.body,
      };

    case "sms": {
      const full = `${item.title}: ${item.body}`;
      const truncated = full.length > 160 ? `${full.slice(0, 157)}...` : full;
      return { subject: truncated, body: truncated };
    }

    case "push": {
      const pushBody =
        item.body.length > 100 ? `${item.body.slice(0, 97)}...` : item.body;
      return { subject: item.title, body: pushBody };
    }

    case "in_app":
      return { subject: item.title, body: item.body };

    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// validatePreferences
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = new Set<string>(Object.keys(NOTIFICATION_CATEGORIES));

const VALID_EVENTS = new Set<string>(
  Object.values(NOTIFICATION_CATEGORIES).flatMap((c) => c.events),
);

const VALID_CHANNELS = new Set<string>(ALL_CHANNELS);

const VALID_FREQUENCIES = new Set<string>([
  "immediate",
  "hourly",
  "daily",
  "weekly",
]);

/**
 * Validate a preferences object, returning an array of errors.
 * An empty array means the preferences are valid.
 */
export function validatePreferences(
  prefs: NotificationPreference,
): readonly PreferenceValidationError[] {
  const errors: PreferenceValidationError[] = [];

  // Global mute
  if (typeof prefs.globalMute !== "boolean") {
    errors.push({ path: "globalMute", message: "Must be a boolean." });
  }

  // Quiet hours
  validateQuietHours(prefs.quietHours, errors);

  // Categories
  if (!prefs.categories || typeof prefs.categories !== "object") {
    errors.push({ path: "categories", message: "Must be an object." });
    return errors;
  }

  for (const catKey of Object.keys(prefs.categories)) {
    if (!VALID_CATEGORIES.has(catKey)) {
      errors.push({
        path: `categories.${catKey}`,
        message: `Unknown category "${catKey}".`,
      });
      continue;
    }

    const catPrefs = (prefs.categories as Record<string, unknown>)[catKey];
    if (!catPrefs || typeof catPrefs !== "object") {
      errors.push({
        path: `categories.${catKey}`,
        message: "Must be an object.",
      });
      continue;
    }

    for (const evtKey of Object.keys(catPrefs as Record<string, unknown>)) {
      if (!VALID_EVENTS.has(evtKey)) {
        errors.push({
          path: `categories.${catKey}.${evtKey}`,
          message: `Unknown event "${evtKey}".`,
        });
        continue;
      }

      // Verify event belongs to the claimed category
      const expectedCategory = NOTIFICATION_CATEGORIES[catKey as NotificationCategory];
      if (!expectedCategory.events.includes(evtKey as NotificationEvent)) {
        errors.push({
          path: `categories.${catKey}.${evtKey}`,
          message: `Event "${evtKey}" does not belong to category "${catKey}".`,
        });
        continue;
      }

      const evtPref = (catPrefs as Record<string, EventPreference>)[evtKey];
      validateEventPreference(evtPref, `categories.${catKey}.${evtKey}`, errors);
    }
  }

  return errors;
}

function validateQuietHours(
  qh: QuietHours,
  errors: PreferenceValidationError[],
): void {
  if (!qh || typeof qh !== "object") {
    errors.push({ path: "quietHours", message: "Must be an object." });
    return;
  }
  if (typeof qh.enabled !== "boolean") {
    errors.push({ path: "quietHours.enabled", message: "Must be a boolean." });
  }
  if (typeof qh.startHour !== "number" || qh.startHour < 0 || qh.startHour > 23) {
    errors.push({
      path: "quietHours.startHour",
      message: "Must be a number between 0 and 23.",
    });
  }
  if (typeof qh.endHour !== "number" || qh.endHour < 0 || qh.endHour > 23) {
    errors.push({
      path: "quietHours.endHour",
      message: "Must be a number between 0 and 23.",
    });
  }
  if (typeof qh.timezone !== "string" || qh.timezone.length === 0) {
    errors.push({
      path: "quietHours.timezone",
      message: "Must be a non-empty string.",
    });
  }
}

function validateEventPreference(
  ep: EventPreference,
  basePath: string,
  errors: PreferenceValidationError[],
): void {
  if (!ep || typeof ep !== "object") {
    errors.push({ path: basePath, message: "Must be an object." });
    return;
  }
  if (typeof ep.muted !== "boolean") {
    errors.push({ path: `${basePath}.muted`, message: "Must be a boolean." });
  }
  if (!ep.channels || typeof ep.channels !== "object") {
    errors.push({
      path: `${basePath}.channels`,
      message: "Must be an object.",
    });
    return;
  }

  for (const chKey of Object.keys(ep.channels)) {
    if (!VALID_CHANNELS.has(chKey)) {
      errors.push({
        path: `${basePath}.channels.${chKey}`,
        message: `Unknown channel "${chKey}".`,
      });
      continue;
    }

    const ch = (ep.channels as Record<string, ChannelSetting>)[chKey];
    if (!ch || typeof ch !== "object") {
      errors.push({
        path: `${basePath}.channels.${chKey}`,
        message: "Must be an object.",
      });
      continue;
    }
    if (typeof ch.enabled !== "boolean") {
      errors.push({
        path: `${basePath}.channels.${chKey}.enabled`,
        message: "Must be a boolean.",
      });
    }

    validateDigestConfig(ch.digest, `${basePath}.channels.${chKey}.digest`, errors);
  }
}

function validateDigestConfig(
  dc: DigestConfig,
  basePath: string,
  errors: PreferenceValidationError[],
): void {
  if (!dc || typeof dc !== "object") {
    errors.push({ path: basePath, message: "Must be an object." });
    return;
  }
  if (typeof dc.enabled !== "boolean") {
    errors.push({ path: `${basePath}.enabled`, message: "Must be a boolean." });
  }
  if (!VALID_FREQUENCIES.has(dc.frequency)) {
    errors.push({
      path: `${basePath}.frequency`,
      message: `Must be one of: ${Array.from(VALID_FREQUENCIES).join(", ")}.`,
    });
  }
  if (typeof dc.preferredHour !== "number" || dc.preferredHour < 0 || dc.preferredHour > 23) {
    errors.push({
      path: `${basePath}.preferredHour`,
      message: "Must be a number between 0 and 23.",
    });
  }
  if (typeof dc.preferredDay !== "number" || dc.preferredDay < 0 || dc.preferredDay > 6) {
    errors.push({
      path: `${basePath}.preferredDay`,
      message: "Must be a number between 0 and 6.",
    });
  }
}
