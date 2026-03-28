"use client";

import Link from "next/link";
import { ArrowRight, Lock, Zap, DollarSign } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/Container";
import { GradientButton } from "@/components/shared/GradientButton";
import { trackCTAClick } from "@/lib/analytics";

interface CTASectionProps {
  onCtaClick?: () => void;
}

const trustBadges = [
  { icon: Lock, label: "100% Confidential", color: "text-[#4c85ff]" },
  { icon: Zap, label: "Results in 48 Hours", color: "text-[#22d3a1]" },
  {
    icon: DollarSign,
    label: "60-Day Money-Back Guarantee",
    color: "text-[#22d3a1]",
  },
] as const;

export function CTASection({ onCtaClick }: CTASectionProps) {
  const prefersReduced = useReducedMotion();
  const { ref: ctaRef, inView: ctaInView } = useInView({
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });

  const fadeUp = {
    hidden: prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: prefersReduced
        ? { duration: 0 }
        : { duration: 0.35, delay, ease: "easeOut" as const },
    }),
  };

  return (
    <section className="relative overflow-hidden bg-[#0a0a0f] py-24 sm:py-32">
      {/* ── Animated background lines (CSS-only) ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #4c85ff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Horizontal sweeping lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={`h-${i}`}
            className="cta-sweep-line-h absolute left-0 h-px w-full"
            style={{
              top: `${15 + i * 18}%`,
              animationDelay: `${i * 1.7}s`,
            }}
          />
        ))}

        {/* Vertical sweeping lines */}
        {[0, 1, 2].map((i) => (
          <div
            key={`v-${i}`}
            className="cta-sweep-line-v absolute top-0 w-px h-full"
            style={{
              left: `${20 + i * 30}%`,
              animationDelay: `${i * 2.3}s`,
            }}
          />
        ))}

        {/* Central radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(76,133,255,0.08),transparent_70%)]" />
      </div>

      <Container className="relative z-10">
        <div ref={ctaRef} className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <motion.h2
            className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            custom={0}
          >
            <span className="text-white">
              Every Day Without AI Marketing{" "}
            </span>
            <br className="hidden sm:block" />
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #4c85ff, #22d3a1, #4c85ff)",
                backgroundSize: "200% auto",
                animation: "gradient-shift 4s ease infinite",
              }}
            >
              Costs You $1,200+ in Lost Jobs
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            custom={0.1}
          >
            While you&apos;re reading this, your competitors&apos; AI systems
            are answering calls, booking appointments, and capturing reviews
            24/7. We cap onboarding to{" "}
            <strong className="text-white">3 new clients per week</strong> to
            guarantee white-glove setup and real results within 60 days &mdash;
            or your money back.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            custom={0.2}
          >
            <Link href="/strategy-call">
              <GradientButton
                size="lg"
                className={cn(
                  "btn-shine cta-glow px-10 py-4 text-base sm:text-lg",
                  "shadow-[0_0_32px_rgba(76,133,255,0.25)]",
                  "hover:shadow-[0_0_48px_rgba(76,133,255,0.4),0_0_80px_rgba(34,211,161,0.15)]"
                )}
                onClick={() => {
                  trackCTAClick("Claim My Free Strategy Call Now", "homepage_cta");
                  onCtaClick?.();
                }}
              >
                Claim My Free Strategy Call Now
                <ArrowRight className="h-5 w-5" />
              </GradientButton>
            </Link>
            <Link
              href="/free-audit"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Or get a free AI audit first &rarr;
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm"
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            custom={0.3}
          >
            {trustBadges.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-muted-foreground backdrop-blur-sm"
              >
                <Icon
                  className={cn("h-4 w-4", color)}
                  aria-hidden="true"
                />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </Container>

      {/* ── Inline keyframes for sweeping lines ── */}
      <style jsx>{`
        .cta-sweep-line-h {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(76, 133, 255, 0.3) 40%,
            rgba(34, 211, 161, 0.15) 60%,
            transparent 100%
          );
          animation: sweep-h 8s ease-in-out infinite;
          opacity: 0;
        }

        .cta-sweep-line-v {
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(76, 133, 255, 0.2) 40%,
            rgba(34, 211, 161, 0.1) 60%,
            transparent 100%
          );
          animation: sweep-v 10s ease-in-out infinite;
          opacity: 0;
        }

        @keyframes sweep-h {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes sweep-v {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cta-sweep-line-h,
          .cta-sweep-line-v {
            animation: none !important;
            opacity: 0 !important;
          }
        }
      `}</style>
    </section>
  );
}
