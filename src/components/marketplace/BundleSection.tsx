"use client";

import { BUNDLES } from "@/lib/constants";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { MarketplaceBundleCard } from "./MarketplaceBundleCard";
import { TooltipProvider } from "@/components/ui/tooltip";

export function BundleSection() {
  return (
    <Section className="relative">
      <Container>
        <FadeInView>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Save More with{" "}
              <GradientText>Bundles</GradientText>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get multiple AI services at a significant discount. The more you
              bundle, the more you save — and the faster your business grows.
            </p>
          </div>
        </FadeInView>

        <TooltipProvider>
          <div className="grid gap-6 md:grid-cols-3">
            {BUNDLES.map((bundle, index) => (
              <FadeInView key={bundle.id} delay={index * 0.1}>
                <MarketplaceBundleCard bundle={bundle} />
              </FadeInView>
            ))}
          </div>
        </TooltipProvider>

        <FadeInView delay={0.3}>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            All bundles include a dedicated account manager, onboarding within 48
            hours, and a 30-day performance guarantee.
          </p>
        </FadeInView>
      </Container>
    </Section>
  );
}
