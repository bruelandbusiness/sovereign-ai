"use client";

import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

export interface CumulativeAreaChartSeries {
  dataKey: string;
  label: string;
  color?: string;
  /** Stack id to create a stacked area chart (optional) */
  stackId?: string;
}

export interface CumulativeAreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: CumulativeAreaChartSeries[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  /** Fill opacity for the area gradient (0 to 1, default 0.15) */
  fillOpacity?: number;
  valueFormatter?: (value: number) => string;
  xTickFormatter?: (value: string) => string;
  yTickFormatter?: (value: number) => string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CumulativeAreaChart = memo(function CumulativeAreaChart({
  data,
  xKey,
  series,
  height = 300,
  showLegend = true,
  showGrid = true,
  fillOpacity = 0.15,
  valueFormatter,
  xTickFormatter,
  yTickFormatter,
}: CumulativeAreaChartProps) {
  const tooltipFormatter = useMemo(() => {
    if (!valueFormatter) return undefined;
    return (value: unknown, name: unknown) => {
      const match = series.find((s) => s.dataKey === String(name));
      return [valueFormatter(Number(value)), match?.label ?? String(name)];
    };
  }, [valueFormatter, series]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
            return (
              <linearGradient
                key={s.dataKey}
                id={`area-gradient-${s.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>

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
        {series.map((s, i) => {
          const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#area-gradient-${s.dataKey})`}
              stackId={s.stackId}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: color }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
});
