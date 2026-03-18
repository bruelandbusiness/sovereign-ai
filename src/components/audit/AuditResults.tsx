"use client";

import { motion } from "framer-motion";
import { Users, TrendingDown, Trophy, RotateCcw, Calendar } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { ScoreCircle } from "./ScoreCircle";
import { FindingsList } from "./FindingsList";
import { FadeInView } from "@/components/shared/FadeInView";
import { staggerContainer, staggerItem } from "@/lib/animations";
import type { AuditResult } from "@/types/audit";

interface AuditResultsProps {
  result: AuditResult;
  onReset: () => void;
}

export function AuditResults({ result, onReset }: AuditResultsProps) {
  const criticalCount = result.findings.filter(
    (f) => f.severity === "critical"
  ).length;

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <GradientOrb position="top-right" size="lg" color="primary" />

      <Container size="lg">
        {/* Score header */}
        <FadeInView>
          <div className="flex flex-col items-center text-center">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Marketing Health Score for
            </p>
            <h2 className="mb-8 font-display text-2xl font-bold sm:text-3xl">
              <GradientText>{result.business_name}</GradientText>
              <span className="ml-2 text-muted-foreground">
                in {result.city}
              </span>
            </h2>

            <ScoreCircle score={result.score} size="lg" />

            {criticalCount > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="mt-6 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400"
              >
                {criticalCount} critical issue{criticalCount > 1 ? "s" : ""} found
              </motion.p>
            )}
          </div>
        </FadeInView>

        {/* Summary stats */}
        <FadeInView delay={0.2}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <motion.div
              variants={staggerItem}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-5"
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="font-display text-2xl font-bold">
                {result.competitor_count}
              </span>
              <span className="text-xs text-muted-foreground">
                Competitors Analyzed
              </span>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="flex flex-col items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-5"
            >
              <TrendingDown className="h-5 w-5 text-red-400" />
              <span className="font-display text-2xl font-bold text-red-400">
                ~{result.estimated_leads_lost}
              </span>
              <span className="text-xs text-muted-foreground">
                Est. Leads Lost / Month
              </span>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5"
            >
              <Trophy className="h-5 w-5 text-amber-400" />
              <span className="font-display text-sm font-bold text-amber-400">
                {result.top_competitor}
              </span>
              <span className="text-xs text-muted-foreground">
                Top Competitor
              </span>
            </motion.div>
          </motion.div>
        </FadeInView>

        {/* Findings */}
        <FadeInView delay={0.3}>
          <div className="mx-auto mt-12 max-w-2xl">
            <h3 className="mb-6 font-display text-lg font-bold">
              Detailed Findings
            </h3>
            <FindingsList findings={result.findings} />
          </div>
        </FadeInView>

        {/* CTA */}
        <FadeInView delay={0.4}>
          <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-10">
            <h3 className="mb-3 font-display text-xl font-bold sm:text-2xl">
              Want Us to Fix Every Issue Above?
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Our AI marketing platform can resolve all {result.findings.length} findings
              automatically. Book a free 15-minute strategy call to see how.
            </p>
            <GradientButton
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                window.open("/onboarding", "_blank");
              }}
            >
              <Calendar className="h-4 w-4" />
              Book Free Strategy Call
            </GradientButton>
          </div>
        </FadeInView>

        {/* Run another */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Run Another Audit
          </button>
        </div>
      </Container>
    </section>
  );
}
