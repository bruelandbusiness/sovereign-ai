"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Lightbulb } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { GradientOrb } from "@/components/layout/GradientOrb";

const stages = [
  "Scanning your Google Business Profile for completeness, photos, hours, and contact info...",
  "Analyzing your review profile across Google, Yelp, and Facebook...",
  "Checking keyword rankings for 8 high-intent search terms in your area...",
  "Benchmarking against the top 5 competitors in your market...",
];

const didYouKnow = [
  "92% of consumers read online reviews before choosing a local business",
  "The top 3 Google results get 75% of all clicks",
  "Businesses with 50+ reviews earn 4x more revenue",
  "63% of consumers will call a business directly from Google",
];

const STAGE_DURATION = 750;

interface ScanningAnimationProps {
  businessName: string;
  onComplete: () => void;
}

export function ScanningAnimation({
  businessName,
  onComplete,
}: ScanningAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = stages.length * STAGE_DURATION;
    const startTime = performance.now();

    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(pct);

      const stage = Math.min(
        Math.floor(elapsed / STAGE_DURATION),
        stages.length - 1
      );
      setCurrentStage(stage);

      if (elapsed < totalDuration) {
        frameId = requestAnimationFrame(tick);
      } else {
        // Brief pause before showing results
        setTimeout(onComplete, 600);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden py-24">
      <GradientOrb position="center" size="lg" color="mixed" />

      <Container size="sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center"
        >
          {/* Pulsing scan icon */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="mb-8 flex h-20 w-20 items-center justify-center rounded-full gradient-bg-subtle"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </motion.div>

          {/* Business name */}
          <h2 className="mb-2 font-display text-2xl font-bold sm:text-3xl">
            Scanning{" "}
            <span className="gradient-text">{businessName}</span>
          </h2>
          <p className="mb-10 text-muted-foreground">
            Our AI is analyzing 47 marketing signals...
          </p>

          {/* Progress bar */}
          <div className="mb-8 w-full max-w-md">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full gradient-bg"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="mt-2 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>

          {/* Stage checklist */}
          <div className="flex w-full max-w-md flex-col gap-3">
            {stages.map((stage, i) => {
              const isComplete = i < currentStage || (i === stages.length - 1 && progress >= 100);
              const isActive = i === currentStage && progress < 100;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.3 }}
                  className="flex items-start gap-3 text-sm"
                >
                  <AnimatePresence mode="wait">
                    {isComplete ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20"
                      >
                        <Check className="h-3 w-3 text-emerald-400" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        key="loading"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      </motion.div>
                    ) : (
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-border/50" />
                    )}
                  </AnimatePresence>
                  <span
                    className={`text-left ${
                      isComplete
                        ? "text-foreground"
                        : isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stage}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Did you know? */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-8 flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm"
            >
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <span className="font-medium text-foreground">Did you know?</span>{" "}
                {didYouKnow[currentStage]}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </Container>
    </section>
  );
}
