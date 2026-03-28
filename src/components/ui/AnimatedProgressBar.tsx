"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient" | "success" | "warning" | "danger";
  className?: string;
}

const trackSizes = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

const barColors = {
  default: "bg-primary",
  gradient: "bg-gradient-to-r from-[#4c85ff] to-[#22d3a1]",
  success: "bg-[#22c55e]",
  warning: "bg-[#f59e0b]",
  danger: "bg-[#ef4444]",
};

export function AnimatedProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = "md",
  variant = "gradient",
  className,
}: AnimatedProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-muted-foreground">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-white/[0.06]",
          trackSizes[size],
        )}
      >
        <motion.div
          className={cn("h-full rounded-full", barColors[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        />
      </div>
    </div>
  );
}
