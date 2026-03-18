"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { size: 80, stroke: 6, fontSize: "text-lg" },
  md: { size: 120, stroke: 8, fontSize: "text-3xl" },
  lg: { size: 160, stroke: 10, fontSize: "text-4xl" },
};

function getScoreColor(score: number): {
  stroke: string;
  text: string;
  glow: string;
} {
  if (score <= 40) {
    return {
      stroke: "#ef4444",
      text: "text-red-400",
      glow: "drop-shadow(0 0 12px rgba(239, 68, 68, 0.4))",
    };
  }
  if (score <= 65) {
    return {
      stroke: "#f59e0b",
      text: "text-amber-400",
      glow: "drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))",
    };
  }
  return {
    stroke: "#22c55e",
    text: "text-emerald-400",
    glow: "drop-shadow(0 0 12px rgba(34, 197, 94, 0.4))",
  };
}

interface ScoreCircleProps {
  score: number;
  size?: keyof typeof sizes;
  className?: string;
}

export function ScoreCircle({ score, size = "md", className }: ScoreCircleProps) {
  const { size: dim, stroke, fontSize } = sizes[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);

  const progress = useMotionValue(0);
  const dashOffset = useTransform(
    progress,
    [0, 1],
    [circumference, circumference - (score / 100) * circumference]
  );

  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const controls = animate(progress, 1, {
      duration: 1.5,
      ease: "easeOut",
    });

    // Count-up animation for the number
    const startTime = performance.now();
    const duration = 1500;
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * score));

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      controls.stop();
      cancelAnimationFrame(frameId);
    };
  }, [score, progress]);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: dim, height: dim }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        className="-rotate-90"
        style={{ filter: color.glow }}
      >
        {/* Background circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/50"
        />

        {/* Animated progress circle */}
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>

      {/* Score text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-display font-bold tabular-nums", fontSize, color.text)}>
          {displayScore}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}
