"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";

interface HeroSectionProps {
  onCtaClick?: () => void;
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
      <GradientOrb position="top-right" size="lg" color="primary" />
      <GradientOrb position="bottom-left" size="md" color="accent" />

      <Container className="relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <FadeInView>
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
              Done-for-you AI marketing
            </p>
          </FadeInView>

          <FadeInView delay={0.1}>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              <GradientText>AI-Powered</GradientText> Marketing{" "}
              <br className="hidden sm:block" />
              That{" "}
              <GradientText>Actually Works</GradientText>
            </h1>
          </FadeInView>

          <FadeInView delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              16 AI-powered marketing services built to generate leads, book
              appointments, and dominate your local market &mdash; all on
              autopilot for local service businesses.
            </p>
          </FadeInView>

          <FadeInView delay={0.3}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/#pricing">
                <GradientButton variant="outline" size="lg">
                  View Pricing
                </GradientButton>
              </Link>
              <GradientButton size="lg" onClick={onCtaClick}>
                Get Free Audit
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </div>
          </FadeInView>

          <FadeInView delay={0.4}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                48-Hour Deployment
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                No Long-Term Contracts
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Dedicated Account Manager
              </div>
            </div>
          </FadeInView>
        </div>
      </Container>
    </section>
  );
}
