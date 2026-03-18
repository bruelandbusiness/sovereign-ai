"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

interface HeroSectionProps {
  onCtaClick?: () => void;
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Premium background */}
      <GradientOrb position="top-right" size="lg" color="primary" />
      <GradientOrb position="bottom-left" size="lg" color="accent" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(76,133,255,0.08) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Trust bar */}
      <div className="relative z-10 border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-3 text-xs sm:text-sm text-muted-foreground">
            <span>Trusted by <strong className="text-foreground">4,200+</strong> Local Service Businesses</span>
            <span className="hidden sm:inline text-border">|</span>
            <span><strong className="text-foreground">23,847</strong> Leads Generated Last Month</span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1">
              <strong className="text-foreground">4.9</strong>
              <span className="text-amber-400">&#9733;</span>
              from <strong className="text-foreground">487</strong> Reviews
            </span>
          </div>
        </Container>
      </div>

      {/* Hero content */}
      <div className="relative z-10 py-20 sm:py-28 lg:py-36">
        <Container className="relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <FadeInView>
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
                Done-for-you AI marketing for home services
              </p>
            </FadeInView>

            <FadeInView delay={0.1}>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                <GradientText>Stop Losing Leads</GradientText> to Competitors{" "}
                <br className="hidden sm:block" />
                With Worse Service
              </h1>
            </FadeInView>

            <FadeInView delay={0.2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                The AI marketing platform built exclusively for home service
                businesses. 16 AI systems work 24/7 to generate leads, book
                appointments, and grow your revenue &mdash; all done for you.
              </p>
            </FadeInView>

            {/* Live metric counter row */}
            <FadeInView delay={0.25}>
              <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
                <div className="text-center">
                  <p className="font-display text-3xl font-bold gradient-text">
                    <AnimatedCounter target={23847} suffix="" prefix="" duration={2000} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Leads Generated</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-bold gradient-text">
                    <AnimatedCounter target={4.2} prefix="$" suffix="M" decimals={1} duration={2000} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Revenue Driven</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-bold gradient-text">
                    <AnimatedCounter target={340} suffix="+" duration={2000} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Active Clients</p>
                </div>
              </div>
            </FadeInView>

            {/* CTA buttons */}
            <FadeInView delay={0.3}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <div className="flex flex-col items-center">
                  <GradientButton
                    size="lg"
                    className="btn-shine px-10 py-3 text-base"
                    onClick={onCtaClick}
                  >
                    Get Your Free Growth Roadmap
                    <ArrowRight className="h-4 w-4" />
                  </GradientButton>
                  <span className="mt-2 text-xs text-muted-foreground">
                    (15-min strategy call &mdash; no obligation)
                  </span>
                </div>
                <GradientButton variant="outline" size="lg" className="gap-2">
                  <Play className="h-4 w-4" />
                  Watch 2-Min Demo
                </GradientButton>
              </div>
            </FadeInView>

            {/* As Featured In */}
            <FadeInView delay={0.4}>
              <div className="mt-14">
                <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  As Featured In
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
                  {["Forbes", "Entrepreneur", "Inc. 500", "TechCrunch"].map(
                    (name) => (
                      <span
                        key={name}
                        className="font-display text-lg font-semibold text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                      >
                        {name}
                      </span>
                    )
                  )}
                </div>
              </div>
            </FadeInView>
          </div>
        </Container>
      </div>
    </section>
  );
}
