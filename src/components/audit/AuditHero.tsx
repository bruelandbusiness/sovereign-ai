"use client";

import { motion } from "framer-motion";
import { ArrowDown, Activity, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";

const stats = [
  { icon: Activity, value: "47", label: "Signals Analyzed" },
  { icon: Clock, value: "30s", label: "Average Scan" },
  { icon: BarChart3, value: "2,400+", label: "Audits Run" },
  { icon: AlertTriangle, value: "89%", label: "Found Critical Issues" },
];

interface AuditHeroProps {
  onScrollToForm: () => void;
}

export function AuditHero({ onScrollToForm }: AuditHeroProps) {
  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pt-32 lg:pt-40">
      <GradientOrb position="top-left" size="lg" color="primary" />
      <GradientOrb position="top-right" size="md" color="accent" />

      <Container size="lg">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          <motion.div
            variants={staggerItem}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <Activity className="h-3.5 w-3.5" />
            Free AI-Powered Marketing Audit
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Your Marketing Is{" "}
            <GradientText>Leaking Money</GradientText>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl"
          >
            Find out exactly where in 30 seconds — completely free.
          </motion.p>

          <motion.div
            variants={staggerItem}
            className="mt-12 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
              >
                <stat.icon className="mb-1 h-4 w-4 text-primary" />
                <span className="font-display text-xl font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>

          <motion.button
            variants={staggerItem}
            onClick={onScrollToForm}
            className="group mt-12 flex flex-col items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Get Your Free Score
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ArrowDown className="h-5 w-5" />
            </motion.div>
          </motion.button>
        </motion.div>
      </Container>
    </section>
  );
}
