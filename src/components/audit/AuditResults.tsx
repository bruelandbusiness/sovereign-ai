"use client";

import { motion } from "framer-motion";
import { Users, TrendingDown, Trophy, RotateCcw, Calendar, AlertCircle, DollarSign } from "lucide-react";
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

function getBenchmarkPercentile(score: number): string {
  if (score < 40) return "23%";
  if (score <= 65) return "48%";
  return "72%";
}

function formatRevenueLost(leadsLost: number): string {
  const revenue = leadsLost * 350;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(revenue);
}

export function AuditResults({ result, onReset }: AuditResultsProps) {
  const criticalCount = result.findings.filter(
    (f) => f.severity === "critical"
  ).length;

  const priorityActions = result.findings
    .filter((f) => f.severity === "critical" || f.severity === "warning")
    .slice(0, 3);

  const percentile = getBenchmarkPercentile(result.score);
  const estimatedRevenueLost = formatRevenueLost(result.estimated_leads_lost);

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <GradientOrb position="top-right" size="lg" color="primary" />

      <Container size="lg">
        {/* Score header */}
        <FadeInView>
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-2 font-display text-2xl font-bold sm:text-3xl">
              Your Marketing Audit Results
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              <GradientText>{result.business_name}</GradientText>
              <span className="ml-2 text-muted-foreground">
                in {result.city}
              </span>
            </p>

            <ScoreCircle score={result.score} size="lg" />

            {/* Benchmark line */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              You scored better than{" "}
              <span className="font-semibold text-foreground">{percentile}</span>{" "}
              of {result.vertical} businesses in {result.city}
            </motion.p>

            {criticalCount > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="mt-4 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400"
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
              className="flex flex-col items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-5"
            >
              <DollarSign className="h-5 w-5 text-red-400" />
              <span className="font-display text-2xl font-bold text-red-400">
                {estimatedRevenueLost}
              </span>
              <span className="text-xs font-medium text-red-400/80">
                Est. Lost Revenue / Month
              </span>
              <span className="text-[10px] text-muted-foreground">
                (~{result.estimated_leads_lost} leads x $350 avg. job)
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

        {/* Priority Action Items */}
        {priorityActions.length > 0 && (
          <FadeInView delay={0.25}>
            <div className="mx-auto mt-12 max-w-2xl">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                Priority Action Items
              </h3>
              <div className="flex flex-col gap-3">
                {priorityActions.map((action, i) => (
                  <div
                    key={`${action.title}-${i}`}
                    className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        action.severity === "critical"
                          ? "border border-red-500/20 bg-red-500/10 text-red-400"
                          : "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      Impact: {action.severity === "critical" ? "High" : "Medium"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>
        )}

        {/* Findings */}
        <FadeInView delay={0.3}>
          <div className="mx-auto mt-12 max-w-2xl">
            <h3 className="mb-6 font-display text-lg font-bold">
              All Findings ({result.findings.length})
            </h3>
            <FindingsList findings={result.findings} />
          </div>
        </FadeInView>

        {/* CTA */}
        <FadeInView delay={0.4}>
          <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center sm:p-10">
            <h3 className="mb-3 font-display text-xl font-bold sm:text-2xl">
              We Can Fix All{" "}
              <GradientText>{String(result.findings.length)}</GradientText>{" "}
              Issues in 48 Hours
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Book a free strategy call and get a custom implementation plan
              worth $2,500
            </p>
            <GradientButton
              size="lg"
              className="btn-shine w-full text-base sm:w-auto"
              onClick={() => {
                window.open("/onboarding", "_blank");
              }}
            >
              <Calendar className="h-4 w-4" />
              Book My Free Strategy Call
            </GradientButton>

            <p className="mt-4 text-xs font-medium text-amber-400">
              Limited to 15 strategy calls this month — 7 spots left
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="text-emerald-400">&#10003; No obligation</span>
              <span className="text-emerald-400">&#10003; 100% confidential</span>
              <span className="text-emerald-400">&#10003; Custom plan included</span>
            </div>
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
