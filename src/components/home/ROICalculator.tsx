"use client";

import { useState } from "react";
import { Calculator, TrendingUp, DollarSign, Users } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { VERTICALS } from "@/lib/constants";

const multipliers: Record<string, number> = {
  hvac: 3.8,
  plumbing: 4.2,
  roofing: 5.1,
  electrical: 3.5,
  landscaping: 3.0,
  "general-contractor": 4.0,
  other: 3.5,
};

export function ROICalculator() {
  const [vertical, setVertical] = useState("hvac");
  const [avgJobValue, setAvgJobValue] = useState(2500);
  const [currentLeads, setCurrentLeads] = useState(15);
  const [calculated, setCalculated] = useState(false);

  const multiplier = multipliers[vertical] || 3.5;
  const projectedLeads = Math.round(currentLeads * multiplier);
  const closeRate = 0.3;
  const monthlyRevenue = Math.round(projectedLeads * closeRate * avgJobValue);
  const annualRevenue = monthlyRevenue * 12;
  const investment = 6997; // Growth bundle
  const roi = Math.round((monthlyRevenue / investment) * 100) / 100;

  return (
    <Section>
      <Container>
        <FadeInView>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <Calculator className="h-4 w-4" />
              ROI Calculator
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              See Your <GradientText>Growth Potential</GradientText>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Enter your business details to see projected results with AI marketing.
            </p>
          </div>
        </FadeInView>

        <FadeInView delay={0.1}>
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium">Your Industry</label>
                  <select
                    value={vertical}
                    onChange={(e) => { setVertical(e.target.value); setCalculated(false); }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  >
                    {VERTICALS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Average Job Value ($)
                  </label>
                  <input
                    type="number"
                    value={avgJobValue}
                    onChange={(e) => { setAvgJobValue(Number(e.target.value) || 0); setCalculated(false); }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    min={0}
                    step={100}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Current Leads Per Month
                  </label>
                  <input
                    type="number"
                    value={currentLeads}
                    onChange={(e) => { setCurrentLeads(Number(e.target.value) || 0); setCalculated(false); }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    min={0}
                  />
                </div>

                <button
                  onClick={() => setCalculated(true)}
                  className="w-full rounded-lg gradient-bg py-3 font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Calculate My ROI
                </button>
              </div>

              {/* Results */}
              <div
                className={`space-y-4 transition-opacity duration-500 ${
                  calculated ? "opacity-100" : "opacity-30"
                }`}
              >
                <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Projected Results with Sovereign AI
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/50 bg-primary/5 p-4 text-center">
                    <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold text-primary">
                      {calculated ? (
                        <AnimatedCounter target={projectedLeads} />
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Leads/Month</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-accent/5 p-4 text-center">
                    <DollarSign className="mx-auto mb-1 h-5 w-5 text-accent" />
                    <p className="text-2xl font-bold text-accent">
                      {calculated ? (
                        <AnimatedCounter target={monthlyRevenue} prefix="$" />
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
                    <DollarSign className="mx-auto mb-1 h-5 w-5 text-foreground" />
                    <p className="text-2xl font-bold">
                      {calculated ? (
                        <AnimatedCounter target={annualRevenue} prefix="$" />
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Annual Revenue</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
                    <TrendingUp className="mx-auto mb-1 h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold text-primary">
                      {calculated ? (
                        <AnimatedCounter target={roi} suffix="x" decimals={1} />
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Monthly ROI</p>
                  </div>
                </div>

                {calculated && (
                  <p className="text-center text-xs text-muted-foreground">
                    Based on {multiplier}x lead multiplier for {VERTICALS.find((v) => v.id === vertical)?.label || vertical} and 30% close rate. Growth bundle at $6,997/mo.
                  </p>
                )}
              </div>
            </div>
          </div>
        </FadeInView>
      </Container>
    </Section>
  );
}
