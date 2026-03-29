/**
 * Dashboard widget registry and configuration system.
 *
 * Pure configuration and helper functions — no database calls.
 * All functions operate on in-memory data structures only.
 */

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

export type WidgetSize = "small" | "medium" | "large" | "full";

export type WidgetCategory =
  | "kpi"
  | "leads"
  | "revenue"
  | "reviews"
  | "bookings"
  | "marketing"
  | "operations"
  | "content";

export type UserRole = "owner" | "manager" | "marketing" | "staff";

export interface Widget {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: WidgetCategory;
  readonly defaultSize: WidgetSize;
  readonly allowedSizes: readonly WidgetSize[];
  readonly minRefreshSeconds: number;
  readonly requiredServices: readonly string[];
  readonly icon: string;
}

export interface WidgetConfig {
  readonly widgetId: string;
  readonly size: WidgetSize;
  readonly position: GridPosition;
  readonly visible: boolean;
  readonly refreshSeconds: number;
  readonly customTitle?: string;
}

export interface GridPosition {
  readonly col: number;
  readonly row: number;
  readonly colSpan: number;
  readonly rowSpan: number;
}

export interface DashboardLayout {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly role: UserRole;
  readonly columns: number;
  readonly widgets: readonly WidgetConfig[];
}

/* ------------------------------------------------------------------ */
/*  Size → grid span mapping                                           */
/* ------------------------------------------------------------------ */

const SIZE_SPANS: Record<WidgetSize, { colSpan: number; rowSpan: number }> = {
  small: { colSpan: 1, rowSpan: 1 },
  medium: { colSpan: 2, rowSpan: 1 },
  large: { colSpan: 2, rowSpan: 2 },
  full: { colSpan: 4, rowSpan: 1 },
} as const;

/* ------------------------------------------------------------------ */
/*  Widget registry                                                    */
/* ------------------------------------------------------------------ */

export const WIDGETS: readonly Widget[] = [
  {
    id: "kpi-summary",
    name: "KPI Summary",
    description:
      "High-level counters for leads, revenue, reviews, and bookings.",
    category: "kpi",
    defaultSize: "full",
    allowedSizes: ["medium", "large", "full"],
    minRefreshSeconds: 60,
    requiredServices: [],
    icon: "BarChart3",
  },
  {
    id: "lead-pipeline",
    name: "Lead Pipeline",
    description: "Funnel visualization of leads by stage.",
    category: "leads",
    defaultSize: "large",
    allowedSizes: ["medium", "large"],
    minRefreshSeconds: 120,
    requiredServices: ["leads"],
    icon: "Filter",
  },
  {
    id: "review-score",
    name: "Review Score",
    description: "Average rating with recent trend line.",
    category: "reviews",
    defaultSize: "small",
    allowedSizes: ["small", "medium"],
    minRefreshSeconds: 300,
    requiredServices: ["reviews"],
    icon: "Star",
  },
  {
    id: "revenue-chart",
    name: "Revenue Chart",
    description: "Monthly recurring revenue trend over time.",
    category: "revenue",
    defaultSize: "large",
    allowedSizes: ["medium", "large", "full"],
    minRefreshSeconds: 300,
    requiredServices: ["payments"],
    icon: "DollarSign",
  },
  {
    id: "recent-activity",
    name: "Recent Activity",
    description: "Chronological feed of system events and actions.",
    category: "operations",
    defaultSize: "medium",
    allowedSizes: ["medium", "large"],
    minRefreshSeconds: 30,
    requiredServices: [],
    icon: "Activity",
  },
  {
    id: "service-health",
    name: "Service Health",
    description: "Operational status for each connected service.",
    category: "operations",
    defaultSize: "medium",
    allowedSizes: ["small", "medium", "large"],
    minRefreshSeconds: 60,
    requiredServices: [],
    icon: "HeartPulse",
  },
  {
    id: "upcoming-bookings",
    name: "Upcoming Bookings",
    description: "Bookings scheduled within the next 7 days.",
    category: "bookings",
    defaultSize: "medium",
    allowedSizes: ["medium", "large"],
    minRefreshSeconds: 120,
    requiredServices: ["bookings"],
    icon: "Calendar",
  },
  {
    id: "campaign-performance",
    name: "Campaign Performance",
    description: "Email and ad campaign metrics at a glance.",
    category: "marketing",
    defaultSize: "large",
    allowedSizes: ["medium", "large", "full"],
    minRefreshSeconds: 300,
    requiredServices: ["campaigns"],
    icon: "Megaphone",
  },
  {
    id: "top-sources",
    name: "Top Sources",
    description: "Breakdown of where leads originate.",
    category: "leads",
    defaultSize: "medium",
    allowedSizes: ["small", "medium", "large"],
    minRefreshSeconds: 300,
    requiredServices: ["leads"],
    icon: "PieChart",
  },
  {
    id: "quick-actions",
    name: "Quick Actions",
    description: "Shortcut buttons for common tasks.",
    category: "operations",
    defaultSize: "small",
    allowedSizes: ["small", "medium"],
    minRefreshSeconds: 0,
    requiredServices: [],
    icon: "Zap",
  },
  {
    id: "competitor-comparison",
    name: "Competitor Comparison",
    description: "Side-by-side market position analysis.",
    category: "marketing",
    defaultSize: "large",
    allowedSizes: ["large", "full"],
    minRefreshSeconds: 3600,
    requiredServices: ["competitors"],
    icon: "Swords",
  },
  {
    id: "content-calendar",
    name: "Content Calendar",
    description: "Timeline view of upcoming social and blog posts.",
    category: "content",
    defaultSize: "large",
    allowedSizes: ["medium", "large", "full"],
    minRefreshSeconds: 300,
    requiredServices: ["content"],
    icon: "CalendarDays",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Widget lookup helpers                                              */
/* ------------------------------------------------------------------ */

const WIDGET_MAP: ReadonlyMap<string, Widget> = new Map(
  WIDGETS.map((w) => [w.id, w]),
);

/**
 * Retrieve a widget definition by id.
 * Returns `undefined` when the id is unknown.
 */
export function getWidgetById(id: string): Widget | undefined {
  return WIDGET_MAP.get(id);
}

/* ------------------------------------------------------------------ */
/*  Default layouts per role                                           */
/* ------------------------------------------------------------------ */

export const DEFAULT_LAYOUTS: readonly DashboardLayout[] = [
  {
    id: "layout-owner",
    name: "Owner Dashboard",
    description: "High-level KPIs, revenue trends, and review health.",
    role: "owner",
    columns: 4,
    widgets: [
      {
        widgetId: "kpi-summary",
        size: "full",
        position: { col: 0, row: 0, colSpan: 4, rowSpan: 1 },
        visible: true,
        refreshSeconds: 60,
      },
      {
        widgetId: "revenue-chart",
        size: "large",
        position: { col: 0, row: 1, colSpan: 2, rowSpan: 2 },
        visible: true,
        refreshSeconds: 300,
      },
      {
        widgetId: "review-score",
        size: "small",
        position: { col: 2, row: 1, colSpan: 1, rowSpan: 1 },
        visible: true,
        refreshSeconds: 300,
      },
      {
        widgetId: "service-health",
        size: "small",
        position: { col: 3, row: 1, colSpan: 1, rowSpan: 1 },
        visible: true,
        refreshSeconds: 60,
      },
      {
        widgetId: "recent-activity",
        size: "medium",
        position: { col: 2, row: 2, colSpan: 2, rowSpan: 1 },
        visible: true,
        refreshSeconds: 30,
      },
    ],
  },
  {
    id: "layout-manager",
    name: "Manager Dashboard",
    description: "Lead management, bookings, and day-to-day activity.",
    role: "manager",
    columns: 4,
    widgets: [
      {
        widgetId: "lead-pipeline",
        size: "large",
        position: { col: 0, row: 0, colSpan: 2, rowSpan: 2 },
        visible: true,
        refreshSeconds: 120,
      },
      {
        widgetId: "upcoming-bookings",
        size: "medium",
        position: { col: 2, row: 0, colSpan: 2, rowSpan: 1 },
        visible: true,
        refreshSeconds: 120,
      },
      {
        widgetId: "recent-activity",
        size: "medium",
        position: { col: 2, row: 1, colSpan: 2, rowSpan: 1 },
        visible: true,
        refreshSeconds: 30,
      },
      {
        widgetId: "top-sources",
        size: "medium",
        position: { col: 0, row: 2, colSpan: 2, rowSpan: 1 },
        visible: true,
        refreshSeconds: 300,
      },
      {
        widgetId: "quick-actions",
        size: "small",
        position: { col: 2, row: 2, colSpan: 1, rowSpan: 1 },
        visible: true,
        refreshSeconds: 0,
      },
    ],
  },
  {
    id: "layout-marketing",
    name: "Marketing Dashboard",
    description: "Campaign metrics, content planning, and SEO insights.",
    role: "marketing",
    columns: 4,
    widgets: [
      {
        widgetId: "campaign-performance",
        size: "full",
        position: { col: 0, row: 0, colSpan: 4, rowSpan: 1 },
        visible: true,
        refreshSeconds: 300,
      },
      {
        widgetId: "content-calendar",
        size: "large",
        position: { col: 0, row: 1, colSpan: 2, rowSpan: 2 },
        visible: true,
        refreshSeconds: 300,
      },
      {
        widgetId: "top-sources",
        size: "medium",
        position: { col: 2, row: 1, colSpan: 2, rowSpan: 1 },
        visible: true,
        refreshSeconds: 300,
      },
      {
        widgetId: "competitor-comparison",
        size: "large",
        position: { col: 2, row: 2, colSpan: 2, rowSpan: 2 },
        visible: true,
        refreshSeconds: 3600,
      },
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  getWidgetsForRole                                                  */
/* ------------------------------------------------------------------ */

/**
 * Return the ordered list of widgets appropriate for a given user role.
 *
 * Falls back to the owner layout when the role has no dedicated layout,
 * filtering out any widgets whose required services are not active.
 */
export function getWidgetsForRole(
  role: UserRole,
  activeServices: readonly string[] = [],
): readonly Widget[] {
  const layout =
    DEFAULT_LAYOUTS.find((l) => l.role === role) ??
    DEFAULT_LAYOUTS.find((l) => l.role === "owner");

  if (!layout) {
    return [];
  }

  const widgetIds = layout.widgets
    .filter((wc) => wc.visible)
    .map((wc) => wc.widgetId);

  return widgetIds.reduce<Widget[]>((acc, id) => {
    const widget = WIDGET_MAP.get(id);
    if (!widget) {
      return acc;
    }

    const servicesAvailable =
      widget.requiredServices.length === 0 ||
      widget.requiredServices.every((s) => activeServices.includes(s));

    if (servicesAvailable) {
      return [...acc, widget];
    }
    return acc;
  }, []);
}

/* ------------------------------------------------------------------ */
/*  validateLayout                                                     */
/* ------------------------------------------------------------------ */

export interface LayoutValidationError {
  readonly code:
    | "UNKNOWN_WIDGET"
    | "OVERLAP"
    | "OUT_OF_BOUNDS"
    | "INVALID_SIZE"
    | "REFRESH_TOO_LOW";
  readonly message: string;
  readonly widgetId: string;
}

export interface LayoutValidationResult {
  readonly valid: boolean;
  readonly errors: readonly LayoutValidationError[];
}

/**
 * Validate that a dashboard layout is internally consistent.
 *
 * Checks performed:
 * - Every widgetId references a registered widget.
 * - No two widgets occupy the same grid cell.
 * - Widgets stay within the column boundary.
 * - The configured size is in the widget's allowedSizes list.
 * - The refresh interval meets the widget's minimum.
 */
export function validateLayout(
  layout: DashboardLayout,
): LayoutValidationResult {
  const errors: LayoutValidationError[] = [];

  // Track occupied cells: "col,row" → widgetId
  const occupied = new Map<string, string>();

  for (const wc of layout.widgets) {
    const widget = WIDGET_MAP.get(wc.widgetId);

    // Unknown widget
    if (!widget) {
      errors.push({
        code: "UNKNOWN_WIDGET",
        message: `Widget "${wc.widgetId}" is not registered.`,
        widgetId: wc.widgetId,
      });
      continue;
    }

    // Invalid size
    if (!widget.allowedSizes.includes(wc.size)) {
      errors.push({
        code: "INVALID_SIZE",
        message:
          `Widget "${wc.widgetId}" does not allow size "${wc.size}". ` +
          `Allowed: ${widget.allowedSizes.join(", ")}.`,
        widgetId: wc.widgetId,
      });
    }

    // Refresh too low
    if (
      widget.minRefreshSeconds > 0 &&
      wc.refreshSeconds < widget.minRefreshSeconds
    ) {
      errors.push({
        code: "REFRESH_TOO_LOW",
        message:
          `Widget "${wc.widgetId}" requires a minimum refresh of ` +
          `${widget.minRefreshSeconds}s but is set to ${wc.refreshSeconds}s.`,
        widgetId: wc.widgetId,
      });
    }

    // Out of bounds
    const { col, row, colSpan, rowSpan } = wc.position;
    if (col + colSpan > layout.columns) {
      errors.push({
        code: "OUT_OF_BOUNDS",
        message:
          `Widget "${wc.widgetId}" extends beyond column boundary ` +
          `(col ${col} + span ${colSpan} > ${layout.columns}).`,
        widgetId: wc.widgetId,
      });
    }

    // Overlap detection
    for (let c = col; c < col + colSpan; c++) {
      for (let r = row; r < row + rowSpan; r++) {
        const key = `${c},${r}`;
        const existing = occupied.get(key);
        if (existing !== undefined) {
          errors.push({
            code: "OVERLAP",
            message:
              `Widget "${wc.widgetId}" overlaps with "${existing}" ` +
              `at cell (${c}, ${r}).`,
            widgetId: wc.widgetId,
          });
        } else {
          occupied.set(key, wc.widgetId);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/* ------------------------------------------------------------------ */
/*  suggestWidgets                                                     */
/* ------------------------------------------------------------------ */

/**
 * Recommend widgets that are relevant to the caller's active services
 * but are not already present in the current layout.
 *
 * Returned in priority order:
 * 1. Widgets whose required services are all active.
 * 2. Service-agnostic widgets (requiredServices is empty).
 */
export function suggestWidgets(
  activeServices: readonly string[],
  currentWidgetIds: readonly string[] = [],
): readonly Widget[] {
  const currentSet = new Set(currentWidgetIds);

  const candidates = WIDGETS.filter((w) => !currentSet.has(w.id));

  const serviceSpecific = candidates.filter(
    (w) =>
      w.requiredServices.length > 0 &&
      w.requiredServices.every((s) => activeServices.includes(s)),
  );

  const universal = candidates.filter(
    (w) => w.requiredServices.length === 0,
  );

  return [...serviceSpecific, ...universal];
}

/* ------------------------------------------------------------------ */
/*  Utility: build a WidgetConfig from defaults                        */
/* ------------------------------------------------------------------ */

/**
 * Create a `WidgetConfig` for a widget using its default size
 * and the provided grid position.
 */
export function buildDefaultWidgetConfig(
  widgetId: string,
  col: number,
  row: number,
): WidgetConfig | undefined {
  const widget = WIDGET_MAP.get(widgetId);
  if (!widget) {
    return undefined;
  }

  const spans = SIZE_SPANS[widget.defaultSize];

  return {
    widgetId,
    size: widget.defaultSize,
    position: {
      col,
      row,
      colSpan: spans.colSpan,
      rowSpan: spans.rowSpan,
    },
    visible: true,
    refreshSeconds: widget.minRefreshSeconds,
  };
}
