"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Shield, Star, Users } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { BundleCard } from "./BundleCard";
import { BUNDLES } from "@/lib/constants";

/** Reverse order so highest-priced plan appears first (price anchoring) */
const BUNDLES_ANCHORED = [...BUNDLES].reverse();

export function BundlePricing() {
  const [annual, setAnnual] = useState(false);
  const prefersReduced = useReducedMotion();
  const { ref: cardsRef, inView: cardsInView } = useInView({
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });

  const pricingStagger = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.08,
        delayChildren: prefersReduced ? 0 : 0.1,
      },
    },
  };

  const pricingItem = {
    hidden: prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReduced
        ? { duration: 0 }
        : { duration: 0.3, ease: "easeOut" as const },
    },
  };

  return (
    <Section id="pricing">
      <Container>
        <FadeInView>
          <div className="mx-auto max-w-2xl text-center">
            {/* Guarantee badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm font-medium text-accent">
              <Shield className="h-4 w-4" />
              60-Day Money-Back Guarantee
            </div>

            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              <GradientText>Cheaper Than an Agency.</GradientText>{" "}
              Better Results Than a Full-Time Hire.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Traditional agencies charge $5K&ndash;$15K/month with 12-month
              lock-ins. Every Sovereign AI plan includes a 60-day money-back
              guarantee and no contracts. If you don&apos;t see results, you
              don&apos;t pay.
            </p>

            {/* Comparison framing */}
            <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>Marketing agency: <span className="font-semibold text-foreground line-through">$10K&ndash;$15K/mo</span></span>
              <span>Full-time marketer: <span className="font-semibold text-foreground line-through">$6K&ndash;$8K/mo</span></span>
              <span>Sovereign AI: <span className="font-bold text-accent">from $497/mo</span></span>
            </div>

            {/* Annual/Monthly toggle */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/50 bg-card p-1" role="radiogroup" aria-label="Billing frequency">
              <button
                role="radio"
                aria-checked={!annual}
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all min-h-[44px] ${
                  !annual
                    ? "gradient-bg text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                role="radio"
                aria-checked={annual}
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all min-h-[44px] ${
                  annual
                    ? "gradient-bg text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <span className="ml-1.5 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                  Save up to $25,992/yr
                </span>
              </button>
            </div>

            {/* Urgency element */}
            <p className="mt-4 text-sm font-medium text-primary">
              <Users className="mr-1 inline h-4 w-4" />
              Only accepting 10 new clients this month &mdash; 3 spots left
            </p>
          </div>
        </FadeInView>

        <motion.div
          ref={cardsRef}
          variants={pricingStagger}
          initial="hidden"
          animate={cardsInView ? "visible" : "hidden"}
          className="mx-auto mt-14 grid max-w-6xl grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {BUNDLES_ANCHORED.map((bundle) => (
            <motion.div key={bundle.id} variants={pricingItem} className="flex">
              <BundleCard bundle={bundle} annual={annual} />
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof near pricing */}
        <FadeInView delay={0.2}>
          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-6 py-4 text-center">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-sm italic text-muted-foreground">
              &ldquo;The Growth plan is the best marketing investment we have ever made. Our cost per lead dropped from $180 to under $25.&rdquo;
            </blockquote>
            <p className="text-xs font-semibold">
              James Okafor, TopShield Roofing &middot; Atlanta, GA
            </p>
          </div>
        </FadeInView>

        <FadeInView delay={0.3}>
          <p className="mt-6 text-center text-base text-muted-foreground">
            Not sure which plan?{" "}
            <Link
              href="/onboarding"
              className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
            >
              Start onboarding
            </Link>{" "}
            and we&apos;ll recommend the right one.
          </p>
        </FadeInView>
      </Container>
    </Section>
  );
}
