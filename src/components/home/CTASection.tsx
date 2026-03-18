"use client";

import { ArrowRight, Lock, Zap, DollarSign } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";

interface CTASectionProps {
  onCtaClick?: () => void;
}

export function CTASection({ onCtaClick }: CTASectionProps) {
  return (
    <Section className="relative overflow-hidden">
      <GradientOrb position="center" size="lg" color="mixed" />

      <Container className="relative z-10">
        <FadeInView>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Your Competitors Are Already Using AI.{" "}
              <br className="hidden sm:block" />
              <GradientText>Are You?</GradientText>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              We only take on <strong className="text-foreground">15 new clients per month</strong> to
              ensure quality.{" "}
              <strong className="text-accent">7 spots remaining for March.</strong>
            </p>

            <div className="mt-10">
              <GradientButton
                size="lg"
                className="btn-shine px-10 py-3 text-base"
                onClick={onCtaClick}
              >
                Claim Your Free Strategy Call
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Join <strong className="text-foreground">4,200+</strong> business
              owners who&apos;ve already made the switch
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                100% Confidential
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Results in 48 Hours
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                30-Day Guarantee
              </div>
            </div>
          </div>
        </FadeInView>
      </Container>
    </Section>
  );
}
