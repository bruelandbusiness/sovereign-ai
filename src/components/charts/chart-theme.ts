/**
 * Shared chart theme constants for Sovereign Empire design system.
 * Matches the dark luxury palette in design-tokens.css.
 */

/** Ordered color palette for chart series data */
export const CHART_COLORS = [
  "#7c5cfc", // accent-primary (indigo/violet)
  "#22c55e", // status-success (emerald)
  "#3b82f6", // status-info (blue)
  "#f59e0b", // status-warning (amber)
  "#ef4444", // status-danger (red)
  "#9478ff", // accent-hover (lighter violet)
  "#10b981", // revenue (teal-green)
  "#f97316", // cta-warm (orange)
] as const;

/** Semantic color helpers for common chart use-cases */
export const SEMANTIC_COLORS = {
  revenue: "#10b981",
  leads: "#3b82f6",
  bookings: "#7c5cfc",
  conversions: "#22c55e",
  cost: "#f59e0b",
  danger: "#ef4444",
  neutral: "#8585a0",
} as const;

/** Shared axis / grid styling tokens */
export const AXIS_STYLE = {
  stroke: "rgba(255, 255, 255, 0.08)",
  tick: { fill: "#8585a0", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
} as const;

/** Default tooltip styling for the dark theme */
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#1a1a28",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
    padding: "8px 12px",
  },
  labelStyle: {
    color: "#f0f0f5",
    fontWeight: 600,
    fontSize: 12,
    marginBottom: 4,
  },
  itemStyle: {
    color: "#a0a0b8",
    fontSize: 12,
    padding: 0,
  },
  cursor: { stroke: "rgba(124, 92, 252, 0.3)" },
} as const;
