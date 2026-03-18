"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { ServiceCard } from "./ServiceCard";
import { SERVICES, SERVICE_CATEGORIES } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function ServicesGrid() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredServices =
    activeCategory === "all"
      ? SERVICES
      : SERVICES.filter((s) => s.category === activeCategory);

  return (
    <Section id="services">
      <Container>
        <FadeInView>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              <GradientText>16 AI Services</GradientText> Built for{" "}
              <br className="hidden sm:block" />
              Local Dominance
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every service you need to generate leads, close deals, and build a
              dominant local brand — powered by AI.
            </p>
          </div>
        </FadeInView>

        <FadeInView delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  activeCategory === cat.id
                    ? "gradient-bg text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </FadeInView>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredServices.map((service) => (
              <motion.div key={service.id} variants={staggerItem}>
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </Container>
    </Section>
  );
}
