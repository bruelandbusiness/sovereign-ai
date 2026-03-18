"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { HOW_IT_WORKS } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Container>
        <FadeInView>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              How It <GradientText>Works</GradientText>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From signup to results in 4 simple steps.
            </p>
          </div>
        </FadeInView>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-4"
        >
          {/* Connecting line (desktop only) */}
          <div className="pointer-events-none absolute top-10 right-12 left-12 hidden h-px bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 md:block" />

          {HOW_IT_WORKS.map((step, index) => (
            <motion.div
              key={step.step}
              variants={staggerItem}
              className="relative text-center"
            >
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/5" />
                <span className="relative font-display text-2xl font-bold gradient-text">
                  {step.step}
                </span>
              </div>

              <h3 className="mt-4 font-display text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
