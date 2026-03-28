"use client";

import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_COLORS, AXIS_STYLE, TOOLTIP_STYLE } from "@/components/charts/chart-theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrendLineChartSeries {
  /** Key in the data objects to pull values from */
  dataKey: string;
  /** Human-readable label shown in legend / tooltip */
  label: string;
  /** Override the default palette color */
  color?: string;
  /** Whether to render a dashed line */
  dashed?: boolean;
}

export interface TrendLineChartProps {
  /** Array of data points; each object must include the `xKey` field plus every series `dataKey` */
  data: Record<string, unknown>[];
  /** The key used for the x-axis (e.g. "date", "month") */
  xKey: string;
  /** One or more series to render */
  series: TrendLineChartSeries[];
  /** Chart height in px (default 300) */
  height?: number;
  /** Show legend (default true) */
  showLegend?: boolean;
  /** Show grid lines (default true) */
  showGrid?: boolean;
  /** Optional value formatter for the tooltip (receives raw value) */
  valueFormatter?: (value: number) => string;
  /** Optional x-axis tick formatter */
  xTickFormatter?: (value: string) => string;
  /** Optional y-axis tick formatter */
  yTickFormatter?: (value: number) => string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TrendLineChart = memo(function TrendLineChart({
  data,
  xKey,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  valueFormatter,
  xTickFormatter,
  yTickFormatter,
}: TrendLineChartProps) {
  const tooltipFormatter = useMemo(() => {
    if (!valueFormatter) return undefined;
    return (value: unknown, name: unknown) => {
      const match = series.find((s) => s.dataKey === String(name));
      return [valueFormatter(Number(value)), match?.label ?? String(name)];
    };
  }, [valueFormatter, series]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={AXIS_STYLE.stroke}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xKey}
          stroke={AXIS_STYLE.stroke}
          tick={AXIS_STYLE.tick}
          axisLine={AXIS_STYLE.axisLine}
          tickLine={AXIS_STYLE.tickLine}
          tickFormatter={xTickFormatter}
        />
        <YAxis
          stroke={AXIS_STYLE.stroke}
          tick={AXIS_STYLE.tick}
          axisLine={AXIS_STYLE.axisLine}
          tickLine={AXIS_STYLE.tickLine}
          tickFormatter={yTickFormatter}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE.contentStyle}
          labelStyle={TOOLTIP_STYLE.labelStyle}
          itemStyle={TOOLTIP_STYLE.itemStyle}
          cursor={TOOLTIP_STYLE.cursor}
          formatter={tooltipFormatter}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a0a0b8", paddingTop: 8 }}
          />
        )}
        {series.map((s, i) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.label}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 5" : undefined}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});
