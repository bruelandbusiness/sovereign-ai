"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
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
              <GradientText>Real Results</GradientText> from Real Business
              Owners
            </h2>
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-base text-muted-foreground">
                <strong className="text-foreground">4.9 out of 5</strong> from{" "}
                <strong className="text-foreground">487</strong> verified reviews
              </p>
            </div>
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
