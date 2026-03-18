"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/constants";
import type { Service } from "@/types/services";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { CatalogFilters } from "@/components/marketplace/CatalogFilters";
import { MarketplaceServiceCard } from "@/components/marketplace/MarketplaceServiceCard";
import { ServiceDetailModal } from "@/components/marketplace/ServiceDetailModal";
import { BundleSection } from "@/components/marketplace/BundleSection";

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return SERVICES;
    return SERVICES.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  function handleLearnMore(service: Service) {
    setSelectedService(service);
    setModalOpen(true);
  }

  function handleModalChange(open: boolean) {
    setModalOpen(open);
    if (!open) {
      // Small delay to let the close animation play before clearing the service
      setTimeout(() => setSelectedService(null), 200);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden page-enter">
      <Header />

      {/* Hero */}
      <Section className="relative overflow-hidden pb-8 pt-20 sm:pb-12 sm:pt-28">
        <GradientOrb position="top-left" size="lg" color="primary" />
        <GradientOrb position="top-right" size="md" color="accent" />
        <Container>
          <FadeInView>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                AI Services{" "}
                <GradientText>Marketplace</GradientText>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Browse our full catalog of AI-powered marketing services.
                Each one is designed to automate, optimize, and scale a critical
                part of your business growth engine.
              </p>

              {/* Compare & Save anchor link */}
              <a
                href="#bundles"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
                Compare &amp; Save with Bundles
              </a>
            </div>
          </FadeInView>
        </Container>
      </Section>

      {/* Trust Bar */}
      <FadeInView>
        <div className="border-y border-border/40 bg-white/[0.02]">
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-4 py-4 sm:gap-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">2,400+</span> Businesses Served
              </div>
              <div className="hidden h-4 w-px bg-border/60 sm:block" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">93%</span> Client Retention
              </div>
              <div className="hidden h-4 w-px bg-border/60 sm:block" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-accent" />
                <span className="font-semibold text-foreground">30-Day</span> Money-Back Guarantee
              </div>
            </div>
          </Container>
        </div>
      </FadeInView>

      {/* Filters + Grid */}
      <Section className="pt-0">
        <Container>
          <FadeInView>
            <div className="mb-10">
              <CatalogFilters
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
          </FadeInView>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredServices.map((service, index) => (
                <MarketplaceServiceCard
                  key={service.id}
                  service={service}
                  index={index}
                  onLearnMore={handleLearnMore}
                />
              ))}
            </AnimatePresence>
          </div>
        </Container>
      </Section>

      {/* Service detail modal */}
      <ServiceDetailModal
        service={selectedService}
        open={modalOpen}
        onOpenChange={handleModalChange}
      />

      {/* Bundle section */}
      <div className="border-t border-border/40">
        <BundleSection />
      </div>

      {/* Extra bottom padding on mobile for sticky bar */}
      <div className="h-20 sm:hidden" />

      <Footer />

      {/* Sticky mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-md p-3 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {filteredServices.length} services starting at{" "}
              <span className="gradient-text">$497/mo</span>
            </p>
          </div>
          <GradientButton size="sm" className="shrink-0 btn-shine">
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
