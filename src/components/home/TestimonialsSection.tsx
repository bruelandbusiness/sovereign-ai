"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { TestimonialCard } from "./TestimonialCard";
import { TESTIMONIALS } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function TestimonialsSection() {
  return (
    <Section>
      <Container>
        <FadeInView>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Trusted by{" "}
              <GradientText>Local Service Leaders</GradientText>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real results from real businesses using Sovereign AI.
            </p>
          </div>
        </FadeInView>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.div key={testimonial.name} variants={staggerItem}>
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
