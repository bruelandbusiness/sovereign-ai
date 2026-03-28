"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCompactCurrency, formatNumber } from "@/lib/formatters";

interface RoiCalculatorProps {
  className?: string;
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => {
    if (prefix === "$") {
      return `${formatCompactCurrency(v)}${suffix}`;
    }
    if (v >= 1_000) {
      return `${prefix}${formatNumber(Math.round(v))}${suffix}`;
    }
    return `${prefix}${formatNumber(Math.round(v))}${suffix}`;
  });

  const prev = useMotionValue(0);

  if (prev.get() !== value) {
    prev.set(value);
    animate(motionVal, value, {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    });
  }

  return <motion.span className={className}>{rounded}</motion.span>;
}

function SliderInput({
  label,
  min,
  max,
  step,
  value,
  onChange,
  prefix = "",
  suffix = "",
  formatValue,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  formatValue?: (v: number) => string;
}) {
  const displayValue = formatValue
    ? formatValue(value)
    : `${prefix}${formatNumber(value)}${suffix}`;

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <span className="text-sm font-semibold text-white tabular-nums">
          {displayValue}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="roi-slider w-full"
          style={
            {
              "--slider-progress": `${percentage}%`,
            } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}

export function RoiCalculator({ className }: RoiCalculatorProps) {
  const [monthlyRevenue, setMonthlyRevenue] = useState(25000);
  const [marketingBudget, setMarketingBudget] = useState(3000);
  const [currentLeads, setCurrentLeads] = useState(50);

  const results = useMemo(() => {
    const projectedLeads = Math.round(currentLeads * 3.5);
    const revenueIncrease = monthlyRevenue * 2.4;
    const roi = Math.round(
      ((revenueIncrease - marketingBudget) / marketingBudget) * 100
    );
    return { projectedLeads, revenueIncrease, roi };
  }, [monthlyRevenue, marketingBudget, currentLeads]);

  const handleRevenueChange = useCallback((v: number) => setMonthlyRevenue(v), []);
  const handleBudgetChange = useCallback((v: number) => setMarketingBudget(v), []);
  const handleLeadsChange = useCallback((v: number) => setCurrentLeads(v), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10",
        "bg-white/[0.03] backdrop-blur-xl",
        "shadow-[0_0_30px_rgba(76,133,255,0.08)]",
        className
      )}
    >
      {/* Gradient accent bar */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4c85ff] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#4c85ff]/5 to-transparent pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            ROI Calculator
          </h3>
          <p className="text-sm text-muted-foreground">
            See what AI-powered growth can do for your business
          </p>
        </div>

        {/* Sliders */}
        <div className="space-y-6 mb-10">
          <SliderInput
            label="Monthly Revenue"
            min={5000}
            max={100000}
            step={1000}
            value={monthlyRevenue}
            onChange={handleRevenueChange}
            formatValue={(v) => formatCompactCurrency(v)}
          />
          <SliderInput
            label="Marketing Budget"
            min={500}
            max={10000}
            step={100}
            value={marketingBudget}
            onChange={handleBudgetChange}
            formatValue={(v) =>
              formatCompactCurrency(v)
            }
          />
          <SliderInput
            label="Current Leads / Month"
            min={5}
            max={200}
            step={1}
            value={currentLeads}
            onChange={handleLeadsChange}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

        {/* Results */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-5 text-center">
            Projected Results
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <AnimatedNumber
                value={results.projectedLeads}
                className="block text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] bg-clip-text text-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Leads / Month</p>
              <span className="inline-block mt-1 text-[10px] font-medium text-[#22d3a1] bg-[#22d3a1]/10 rounded-full px-2 py-0.5">
                3.5x increase
              </span>
            </div>

            <div className="text-center">
              <AnimatedNumber
                value={results.revenueIncrease}
                prefix="$"
                className="block text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] bg-clip-text text-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Projected Revenue
              </p>
              <span className="inline-block mt-1 text-[10px] font-medium text-[#22d3a1] bg-[#22d3a1]/10 rounded-full px-2 py-0.5">
                2.4x growth
              </span>
            </div>

            <div className="text-center">
              <AnimatedNumber
                value={results.roi}
                suffix="%"
                className="block text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] bg-clip-text text-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1.5">ROI</p>
              <span className="inline-block mt-1 text-[10px] font-medium text-[#22d3a1] bg-[#22d3a1]/10 rounded-full px-2 py-0.5">
                return on spend
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white",
            "bg-gradient-to-r from-[#4c85ff] to-[#22d3a1]",
            "shadow-[0_0_20px_rgba(76,133,255,0.3)]",
            "hover:shadow-[0_0_30px_rgba(76,133,255,0.5)]",
            "transition-shadow duration-300",
            "cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          Get Your Custom ROI Report
        </motion.button>
      </div>

      {/* Slider styles */}
      <style jsx>{`
        .roi-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(
            to right,
            #4c85ff 0%,
            #4c85ff var(--slider-progress),
            rgba(255, 255, 255, 0.1) var(--slider-progress),
            rgba(255, 255, 255, 0.1) 100%
          );
          outline: none;
          cursor: pointer;
        }
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #4c85ff;
          border: 3px solid #0a0a0f;
          box-shadow: 0 0 10px rgba(76, 133, 255, 0.5);
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .roi-slider:focus-visible {
          outline: 2px solid var(--ring, #4c85ff);
          outline-offset: 2px;
          border-radius: 3px;
        }
        .roi-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px rgba(76, 133, 255, 0.7);
        }
        .roi-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #4c85ff;
          border: 3px solid #0a0a0f;
          box-shadow: 0 0 10px rgba(76, 133, 255, 0.5);
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
}
