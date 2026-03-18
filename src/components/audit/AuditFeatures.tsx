"use client";

import { motion } from "framer-motion";
import { MapPin, Search, Users, ListChecks } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { IconBadge } from "@/components/shared/IconBadge";
import { staggerContainer, staggerItem } from "@/lib/animations";

const features = [
  {
    icon: MapPin,
    color: "bg-blue-500/10 text-blue-400",
    title: "Google Presence Score",
    description:
      "Reviews count, Google Business Profile completeness, local pack ranking, and map visibility for your service area.",
  },
  {
    icon: Search,
    color: "bg-emerald-500/10 text-emerald-400",
    title: "SEO Opportunity Sizing",
    description:
      "Missing keywords you should be ranking for, content gaps compared to competitors, and estimated traffic potential.",
  },
  {
    icon: Users,
    color: "bg-amber-500/10 text-amber-400",
    title: "Competitor Intelligence",
    description:
      "Who is outranking you and why. See their review counts, keyword coverage, and marketing strategies side by side.",
  },
  {
    icon: ListChecks,
    color: "bg-purple-500/10 text-purple-400",
    title: "Actionable Recommendations",
    description:
      "Exactly what to fix and in what order. Prioritized by impact so you know where to focus your time and budget first.",
  },
];

export function AuditFeatures() {
  return (
    <Section>
      <Container size="lg">
        <div className="mb-12 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            What Your Audit <GradientText>Reveals</GradientText>
          </h2>
          <p className="mt-3 text-muted-foreground">
            A complete picture of your marketing health in 30 seconds.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-6 sm:grid-cols-2"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border"
            >
              <IconBadge
                icon={feature.icon}
                color={feature.color}
                size="lg"
                className="mb-4"
              />
              <h3 className="mb-2 font-display text-base font-semibold">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
