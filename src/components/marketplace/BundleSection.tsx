"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { BUNDLES, getServiceById, formatPrice } from "@/lib/constants";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { Badge } from "@/components/ui/badge";
import { MarketplaceBundleCard } from "./MarketplaceBundleCard";
import { TooltipProvider } from "@/components/ui/tooltip";

export function BundleSection() {
  // Calculate real individual-vs-bundle savings for the most popular bundle
  const savingsComparison = useMemo(() => {
    const popular = BUNDLES.find((b) => b.popular) ?? BUNDLES[1];
    const individualTotal = popular.services.reduce((sum, id) => {
      const svc = getServiceById(id);
      return sum + (svc?.price ?? 0);
    }, 0);
    return { individualTotal, bundlePrice: popular.price, name: popular.name };
  }, []);

  return (
    <Section id="bundles" className="relative scroll-mt-20">
      <Container>
        <FadeInView>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Save More with{" "}
                <GradientText>Bundles</GradientText>
              </h2>
              <Badge
                variant="default"
                className="gradient-bg border-0 text-white text-xs"
              >
                Save up to 40%
              </Badge>
            </div>
            <p className="mt-4 text-lg text-muted-foreground">
              Get multiple AI services at a significant discount. The more you
              bundle, the more you save — and the faster your business grows.
            </p>

            {/* Individual vs Bundle comparison */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border/40 bg-white/[0.02] px-5 py-3 text-sm">
              <span className="text-muted-foreground">
                Individual services:{" "}
                <span className="font-medium text-foreground line-through">
                  {formatPrice(savingsComparison.individualTotal)}/mo
                </span>
              </span>
              <span className="text-muted-foreground/40">&rarr;</span>
              <span className="text-muted-foreground">
                {savingsComparison.name} bundle:{" "}
                <span className="font-bold text-accent">
                  {formatPrice(savingsComparison.bundlePrice)}/mo
                </span>
              </span>
            </div>

            {/* Social proof */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>
                <span className="font-semibold text-foreground">94%</span> of our clients choose a bundle
              </span>
            </div>
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
            hours, and a 60-day performance guarantee.
          </p>
        </FadeInView>
      </Container>
    </Section>
  );
}
