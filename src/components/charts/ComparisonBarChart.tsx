"use client";

import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

export interface ComparisonBarChartSeries {
  dataKey: string;
  label: string;
  color?: string;
  /** Stack id to group bars together (optional) */
  stackId?: string;
}

export interface ComparisonBarChartProps {
  data: Record<string, unknown>[];
  /** Key used for the category (x) axis */
  xKey: string;
  series: ComparisonBarChartSeries[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  /** Horizontal layout (bars go left-to-right) */
  horizontal?: boolean;
  /** Radius on the bar corners */
  barRadius?: number;
  valueFormatter?: (value: number) => string;
  xTickFormatter?: (value: string) => string;
  yTickFormatter?: (value: number) => string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ComparisonBarChart = memo(function ComparisonBarChart({
  data,
  xKey,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  horizontal = false,
  barRadius = 4,
  valueFormatter,
  xTickFormatter,
  yTickFormatter,
}: ComparisonBarChartProps) {
  const tooltipFormatter = useMemo(() => {
    if (!valueFormatter) return undefined;
    return (value: unknown, name: unknown) => {
      const match = series.find((s) => s.dataKey === String(name));
      return [valueFormatter(Number(value)), match?.label ?? String(name)];
    };
  }, [valueFormatter, series]);

  const layout = horizontal ? "vertical" : "horizontal";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 4, right: 8, bottom: 0, left: horizontal ? 40 : -12 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={AXIS_STYLE.stroke}
            vertical={!horizontal}
            horizontal={horizontal}
          />
        )}

        {horizontal ? (
          <>
            <XAxis
              type="number"
              stroke={AXIS_STYLE.stroke}
              tick={AXIS_STYLE.tick}
              axisLine={AXIS_STYLE.axisLine}
              tickLine={AXIS_STYLE.tickLine}
              tickFormatter={yTickFormatter}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              stroke={AXIS_STYLE.stroke}
              tick={AXIS_STYLE.tick}
              axisLine={AXIS_STYLE.axisLine}
              tickLine={AXIS_STYLE.tickLine}
              tickFormatter={xTickFormatter}
              width={80}
            />
          </>
        ) : (
          <>
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
          </>
        )}

        <Tooltip
          contentStyle={TOOLTIP_STYLE.contentStyle}
          labelStyle={TOOLTIP_STYLE.labelStyle}
          itemStyle={TOOLTIP_STYLE.itemStyle}
          cursor={{ fill: "rgba(124, 92, 252, 0.06)" }}
          formatter={tooltipFormatter}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a0a0b8", paddingTop: 8 }}
          />
        )}
        {series.map((s, i) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.label}
            fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            stackId={s.stackId}
            radius={[barRadius, barRadius, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
});
