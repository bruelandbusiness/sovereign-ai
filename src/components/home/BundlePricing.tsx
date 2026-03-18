"use client";

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
              <BundleCard bundle={bundle} onSelect={onSelect} />
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
