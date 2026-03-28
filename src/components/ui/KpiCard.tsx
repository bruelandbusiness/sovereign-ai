"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatters";

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: string;
  trendUp?: boolean;
  sparklineData?: number[];
  className?: string;
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (value >= 1000) {
      return `${prefix}${formatNumber(Math.round(latest))}${suffix}`;
    }
    if (value % 1 !== 0) {
      return `${prefix}${latest.toFixed(1)}${suffix}`;
    }
    return `${prefix}${formatNumber(Math.round(latest))}${suffix}`;
  });
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration: 1.5,
      ease: "easeOut" as const,
    });
    return controls.stop;
  }, [inView, motionValue, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function Sparkline({
  data,
  color,
  width = 80,
  height = 32,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const innerH = height - padding * 2;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + innerH - ((v - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="shrink-0"
      role="img"
      aria-label="Sparkline chart"
    >
      <polyline
        points={points}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function KpiCard({
  title,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendUp = true,
  sparklineData,
  className,
}: KpiCardProps) {
  const sparkColor = trendUp ? "#22d3a1" : "#ef4444";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-xl border border-white/[0.06]",
        "bg-white/[0.02] backdrop-blur-md",
        "p-5 overflow-hidden",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white/50 mb-1 truncate">{title}</p>
          <p className="text-2xl font-semibold text-white tracking-tight">
            <AnimatedNumber
              value={value}
              prefix={prefix}
              suffix={suffix}
            />
          </p>
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} color={sparkColor} />
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trendUp
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            )}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className={cn(!trendUp && "rotate-180")}
            >
              <path
                d="M6 2.5L9.5 6.5H2.5L6 2.5Z"
                fill="currentColor"
              />
            </svg>
            {trend}
          </span>
        </div>
      )}
    </motion.div>
  );
}
