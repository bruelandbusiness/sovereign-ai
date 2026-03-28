"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { GradientButton } from "@/components/shared/GradientButton";
import { FadeInView } from "@/components/shared/FadeInView";
import { HOW_IT_WORKS } from "@/lib/constants";

export function HowItWorks() {
  const prefersReduced = useReducedMotion();
  const { ref: stepsRef, inView: stepsInView } = useInView({
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });

  const stepsContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.1,
        delayChildren: prefersReduced ? 0 : 0.1,
      },
    },
  };

  const stepItem = {
    hidden: prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReduced
        ? { duration: 0 }
        : { duration: 0.35, ease: "easeOut" as const },
    },
  };

  return (
    <Section id="how-it-works">
      <Container>
        <FadeInView>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              From Zero to <GradientText>New Leads in 48 Hours</GradientText>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No tech skills needed. We handle the heavy lifting &mdash; you just
              answer the phone.
            </p>
          </div>
        </FadeInView>

        <motion.div
          ref={stepsRef}
          variants={stepsContainer}
          initial="hidden"
          animate={stepsInView ? "visible" : "hidden"}
          className="relative mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-4"
        >
          {/* Connecting line (desktop only) */}
          <div className="pointer-events-none absolute top-10 right-12 left-12 hidden h-px bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 md:block" />

          {HOW_IT_WORKS.map((step) => (
            <motion.div
              key={step.step}
              variants={stepItem}
              className="relative text-center"
            >
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/5" />
                <span className="relative font-display text-2xl font-bold gradient-text">
                  {step.step}
                </span>
              </div>

              {/* Time indicator */}
              <div className="mt-2">
                <span className="inline-block rounded-full bg-accent/10 px-3 py-0.5 text-xs font-semibold text-accent">
                  {step.time}
                </span>
              </div>

              <h3 className="mt-3 font-display text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <FadeInView delay={0.3}>
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/services">
              <GradientButton variant="outline" size="lg" className="gap-2">
                Explore All 16 AI Services
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </Link>
            <Link
              href="/demo"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See a live demo &rarr;
            </Link>
          </div>
        </FadeInView>
      </Container>
    </Section>
  );
}
