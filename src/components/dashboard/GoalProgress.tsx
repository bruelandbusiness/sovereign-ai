"use client";

import { useMemo, useState, useEffect } from "react";
import { Target, TrendingUp, Trophy, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "@/components/ui/Confetti";
import { cn } from "@/lib/utils";

interface GoalProgressProps {
  current: number;
  total: number;
  label?: string;
}

/**
 * Computes projected end-of-month total based on current pace.
 * Uses the number of days elapsed vs total days in the month.
 */
function computeProjection(current: number, total: number): {
  projected: number;
  onTrack: boolean;
  paceLabel: string;
} {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  if (dayOfMonth === 0) {
    return { projected: 0, onTrack: false, paceLabel: "Start of month" };
  }

  const dailyRate = current / dayOfMonth;
  const projected = Math.round(dailyRate * daysInMonth);
  const onTrack = projected >= total;

  if (current >= total) {
    return { projected, onTrack: true, paceLabel: "Goal reached!" };
  }

  const needed = total - current;
  const neededPerDay = daysRemaining > 0 ? Math.ceil(needed / daysRemaining) : needed;

  const paceLabel = onTrack
    ? `On pace for ${projected} leads`
    : `Need ~${neededPerDay}/day to hit goal`;

  return { projected, onTrack, paceLabel };
}

export function GoalProgress({
  current,
  total,
  label = "leads",
}: GoalProgressProps) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const goalHit = current >= total;
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const { projected, onTrack, paceLabel } = useMemo(
    () => computeProjection(current, total),
    [current, total]
  );

  // Trigger confetti once when goal is first reached — setState is intentional here
  // to drive a one-shot visual effect that cleans up via setTimeout.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (goalHit && !hasTriggeredConfetti) {
      setShowConfetti(true);
      setHasTriggeredConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [goalHit, hasTriggeredConfetti]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <>
      <Confetti active={showConfetti} count={60} duration={4000} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "rounded-xl border p-4 sm:p-5 transition-colors duration-300",
          goalHit
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-primary/20 bg-primary/5"
        )}
      >
        {/* Header row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {goalHit ? (
                <motion.div
                  key="trophy"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Trophy className="h-5 w-5 shrink-0 text-emerald-400" />
                </motion.div>
              ) : (
                <motion.div key="target" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                  <Target className="h-5 w-5 shrink-0 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
            <div>
              <p className="text-sm font-medium">
                {goalHit ? (
                  <span className="text-emerald-400">
                    Goal achieved! {current} of {total} {label}
                  </span>
                ) : (
                  <>
                    This month&apos;s goal:{" "}
                    <span className="text-foreground">{total} {label}</span>
                    {" "}&mdash; You&apos;re at{" "}
                    <span className="font-bold text-emerald-400">{current}</span>
                    {" "}
                    <span className="text-muted-foreground">({percent}%)</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pace / projection indicator */}
            <div className="flex items-center gap-1.5">
              <TrendingUp
                className={cn(
                  "h-3.5 w-3.5",
                  onTrack ? "text-emerald-400" : "text-amber-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  onTrack ? "text-emerald-400" : "text-amber-400"
                )}
              >
                {paceLabel}
              </span>
            </div>

            {!goalHit && (
              <span className="text-sm font-semibold text-primary tabular-nums">
                {total - current} to go
              </span>
            )}
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="mt-3 relative">
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Monthly ${label} goal: ${percent}% complete, ${current} of ${total}`}
          >
            <motion.div
              className={cn(
                "h-full rounded-full transition-colors duration-300",
                goalHit
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-r from-primary to-primary/70"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Projected marker (only show if not already at goal and projection is meaningful) */}
          {!goalHit && projected > current && projected <= total * 1.5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="absolute top-0 h-2.5"
              style={{ left: `${Math.min(100, (projected / total) * 100)}%` }}
            >
              <div className="relative -ml-px h-full w-0.5 bg-muted-foreground/30">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  ~{projected} proj.
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Celebration badge */}
        <AnimatePresence>
          {goalHit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
                <PartyPopper className="h-4 w-4 text-emerald-400" />
                <p className="text-xs font-medium text-emerald-400">
                  Congratulations! You&apos;ve exceeded your monthly target.
                  {current > total && (
                    <span className="ml-1 text-emerald-300">
                      +{current - total} above goal!
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
