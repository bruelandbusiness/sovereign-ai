"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { SERVICES } from "@/lib/constants";
import type { Service } from "@/types/services";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
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
    <div className="relative min-h-screen overflow-x-hidden">
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
            </div>
          </FadeInView>
        </Container>
      </Section>

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

      <Footer />
    </div>
  );
}
