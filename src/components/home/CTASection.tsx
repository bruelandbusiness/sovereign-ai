"use client";

import { ArrowRight } from "lucide-react";
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
              Ready to Put{" "}
              <GradientText>AI to Work</GradientText>{" "}
              <br className="hidden sm:block" />
              for Your Business?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Book a free strategy call and we&apos;ll show you exactly how our
              AI services can transform your lead generation and revenue.
            </p>

            <div className="mt-10">
              <GradientButton size="lg" onClick={onCtaClick}>
                Book Free Strategy Call
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              No obligation. No credit card. Just results.
            </p>
          </div>
        </FadeInView>
      </Container>
    </Section>
  );
}
