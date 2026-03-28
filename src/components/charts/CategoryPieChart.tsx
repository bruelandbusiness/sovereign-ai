"use client";

import { memo, useState, useMemo, useCallback } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chart-theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryPieChartDatum {
  name: string;
  value: number;
  color?: string;
}

export interface CategoryPieChartProps {
  data: CategoryPieChartDatum[];
  height?: number;
  /** Inner radius as percentage of outer radius (0 = pie, 60 = donut). Default 60. */
  innerRadiusPercent?: number;
  /** Show an interactive active sector on hover (default true) */
  interactive?: boolean;
  /** Centre label (e.g. total value). Displayed inside the donut hole. */
  centreLabel?: string;
  /** Smaller sub-label below the centre label */
  centreSubLabel?: string;
  /** Optional value formatter for the tooltip */
  valueFormatter?: (value: number) => string;
}

// ---------------------------------------------------------------------------
// Active shape renderer
// ---------------------------------------------------------------------------

function renderActiveShape(props: PieSectorDataItem) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={(outerRadius as number) + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={(outerRadius as number) + 8}
        outerRadius={(outerRadius as number) + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CategoryPieChart = memo(function CategoryPieChart({
  data,
  height = 300,
  innerRadiusPercent = 60,
  interactive = true,
  centreLabel,
  centreSubLabel,
  valueFormatter,
}: CategoryPieChartProps) {
  const [_activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = useCallback(
    (_: unknown, index: number) => {
      if (interactive) setActiveIndex(index);
    },
    [interactive],
  );

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const tooltipFormatter = useMemo(() => {
    if (!valueFormatter) return undefined;
    return (value: unknown) => [valueFormatter(Number(value)), ""];
  }, [valueFormatter]);

  const outerRadius = Math.floor((height - 40) / 2);
  const innerRadius = Math.floor(outerRadius * (innerRadiusPercent / 100));
  const showCentre = innerRadiusPercent > 0 && (centreLabel ?? centreSubLabel);

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            paddingAngle={2}
            activeShape={interactive ? renderActiveShape : undefined}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE.contentStyle}
            labelStyle={TOOLTIP_STYLE.labelStyle}
            itemStyle={TOOLTIP_STYLE.itemStyle}
            formatter={tooltipFormatter}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Centre text overlay for donut charts */}
      {showCentre && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centreLabel && (
            <span className="text-2xl font-bold text-text-primary">
              {centreLabel}
            </span>
          )}
          {centreSubLabel && (
            <span className="text-xs text-text-secondary">
              {centreSubLabel}
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  entry.color ?? CHART_COLORS[i % CHART_COLORS.length],
              }}
            />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
