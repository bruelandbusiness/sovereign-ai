"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { BundleCard } from "./BundleCard";
import { BUNDLES } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface BundlePricingProps {
  onSelect?: () => void;
}

export function BundlePricing({ onSelect }: BundlePricingProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <Section id="pricing">
      <Container>
        <FadeInView>
          <div className="mx-auto max-w-2xl text-center">
            {/* Guarantee badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm font-medium text-accent">
              <Shield className="h-4 w-4" />
              30-Day Money-Back Guarantee
            </div>

            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              <GradientText>Transparent Pricing.</GradientText>{" "}
              Guaranteed Results.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every plan includes a 30-day money-back guarantee. If you
              don&apos;t see results, you don&apos;t pay.
            </p>

            {/* Annual/Monthly toggle */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/50 bg-card p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  !annual
                    ? "gradient-bg text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  annual
                    ? "gradient-bg text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <span className="ml-1.5 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                  2 months free
                </span>
              </button>
            </div>
          </div>
        </FadeInView>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mx-auto mt-14 grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-3"
        >
          {BUNDLES.map((bundle) => (
            <motion.div key={bundle.id} variants={staggerItem} className="flex">
              <BundleCard bundle={bundle} onSelect={onSelect} annual={annual} />
            </motion.div>
          ))}
        </motion.div>

        <FadeInView delay={0.3}>
          <p className="mt-10 text-center text-base text-muted-foreground">
            Not sure which plan?{" "}
            <button
              onClick={onSelect}
              className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
            >
              Book a free call
            </button>{" "}
            and we&apos;ll recommend the right one.
          </p>
        </FadeInView>
      </Container>
    </Section>
  );
}
