"use client";

import { motion } from "framer-motion";
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
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Simple Pricing,{" "}
              <GradientText>Massive Results</GradientText>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose a bundle that fits your goals. Every plan includes dedicated
              support and a 48-hour deployment guarantee.
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
      </Container>
    </Section>
  );
}
