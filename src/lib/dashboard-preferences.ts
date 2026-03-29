/**
 * Dashboard Preferences / Customization Utility
 *
 * Provides types, defaults, merge logic, and validation for
 * per-user dashboard layout and display preferences.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardPreferences {
  kpiOrder: string[]; // Which KPI cards to show and in what order
  defaultView: "overview" | "services" | "leads";
  compactMode: boolean; // Dense vs spacious layout
  chartTimeRange: "7d" | "30d" | "90d" | "12m";
  hiddenWidgets: string[]; // Widgets the user has dismissed
  favoriteServices: string[]; // Pinned services
  notificationSound: boolean;
  timezone: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  kpiOrder: ["leads", "reviews", "revenue", "bookings"],
  defaultView: "overview",
  compactMode: false,
  chartTimeRange: "30d",
  hiddenWidgets: [],
  favoriteServices: [],
  notificationSound: true,
  timezone: "America/New_York",
};

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

/**
 * Merge saved (partial) preferences over the defaults.
 * If `saved` is null or undefined the full defaults are returned.
 */
export function mergePreferences(
  saved: Partial<DashboardPreferences> | null,
): DashboardPreferences {
  if (!saved) return { ...DEFAULT_PREFERENCES };
  return { ...DEFAULT_PREFERENCES, ...saved };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_DEFAULT_VIEWS = new Set<DashboardPreferences["defaultView"]>([
  "overview",
  "services",
  "leads",
]);

const VALID_CHART_TIME_RANGES = new Set<
  DashboardPreferences["chartTimeRange"]
>(["7d", "30d", "90d", "12m"]);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a partial (or full) preferences object that was loaded from
 * storage.  Returns a list of human-readable error strings. An empty
 * `errors` array means the preferences are valid.
 */
export function validatePreferences(
  prefs: Partial<DashboardPreferences> | null | undefined,
): ValidationResult {
  const errors: string[] = [];

  if (prefs === null || prefs === undefined) {
    return { valid: true, errors };
  }

  if (typeof prefs !== "object" || Array.isArray(prefs)) {
    return { valid: false, errors: ["Preferences must be a plain object."] };
  }

  // kpiOrder
  if ("kpiOrder" in prefs) {
    if (
      !Array.isArray(prefs.kpiOrder) ||
      !prefs.kpiOrder.every((v) => typeof v === "string")
    ) {
      errors.push("kpiOrder must be an array of strings.");
    }
  }

  // defaultView
  if (
    "defaultView" in prefs &&
    !VALID_DEFAULT_VIEWS.has(prefs.defaultView as DashboardPreferences["defaultView"])
  ) {
    errors.push(
      `defaultView must be one of: ${[...VALID_DEFAULT_VIEWS].join(", ")}.`,
    );
  }

  // compactMode
  if ("compactMode" in prefs && typeof prefs.compactMode !== "boolean") {
    errors.push("compactMode must be a boolean.");
  }

  // chartTimeRange
  if (
    "chartTimeRange" in prefs &&
    !VALID_CHART_TIME_RANGES.has(
      prefs.chartTimeRange as DashboardPreferences["chartTimeRange"],
    )
  ) {
    errors.push(
      `chartTimeRange must be one of: ${[...VALID_CHART_TIME_RANGES].join(", ")}.`,
    );
  }

  // hiddenWidgets
  if ("hiddenWidgets" in prefs) {
    if (
      !Array.isArray(prefs.hiddenWidgets) ||
      !prefs.hiddenWidgets.every((v) => typeof v === "string")
    ) {
      errors.push("hiddenWidgets must be an array of strings.");
    }
  }

  // favoriteServices
  if ("favoriteServices" in prefs) {
    if (
      !Array.isArray(prefs.favoriteServices) ||
      !prefs.favoriteServices.every((v) => typeof v === "string")
    ) {
      errors.push("favoriteServices must be an array of strings.");
    }
  }

  // notificationSound
  if (
    "notificationSound" in prefs &&
    typeof prefs.notificationSound !== "boolean"
  ) {
    errors.push("notificationSound must be a boolean.");
  }

  // timezone
  if ("timezone" in prefs) {
    if (typeof prefs.timezone !== "string" || prefs.timezone.length === 0) {
      errors.push("timezone must be a non-empty string.");
    }
  }

  return { valid: errors.length === 0, errors };
}
