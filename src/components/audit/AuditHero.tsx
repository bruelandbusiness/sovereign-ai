"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Activity, Clock, BarChart3, AlertTriangle, Shield, Mail, Target } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { staggerContainer, staggerItem } from "@/lib/animations";

const stats = [
  { icon: Activity, value: "47", label: "Marketing Signals Scanned" },
  { icon: Clock, value: "< 30s", label: "Second Analysis" },
  { icon: BarChart3, value: "2,400+", label: "Audits Completed" },
  { icon: AlertTriangle, value: "89%", label: "Discover Critical Issues" },
];

const tickerItems = [
  "Rodriguez HVAC scored 34/100 — 4 critical issues found",
  "Apex Roofing scored 52/100 — 3 critical issues found",
  "Thompson Plumbing scored 28/100 — 5 critical issues found",
  "Summit Electric scored 61/100 — 2 critical issues found",
];

const trustBadges = [
  { icon: Shield, label: "100% Private" },
  { icon: Mail, label: "No Spam Ever" },
  { icon: Target, label: "AI-Powered Accuracy" },
];

interface AuditHeroProps {
  onScrollToForm: () => void;
}

export function AuditHero({ onScrollToForm }: AuditHeroProps) {
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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
          {/* Price badge */}
          <motion.div
            variants={staggerItem}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2 text-sm font-semibold text-amber-300"
          >
            <Target className="h-4 w-4" />
            Previously a $497 Service — Now Free for a Limited Time
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Discover Exactly Where Your Marketing Is{" "}
            <GradientText>Leaking Money</GradientText>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Our AI scans 47 marketing signals across Google, SEO, reviews, ads,
            and competitors — then shows you exactly what to fix. Takes 30
            seconds. No credit card needed.
          </motion.p>

          {/* Stats grid */}
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

          {/* Rotating ticker */}
          <motion.div
            variants={staggerItem}
            className="mt-8 h-10 w-full max-w-lg overflow-hidden rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={tickerIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex h-full items-center justify-center gap-2 px-4 text-sm text-muted-foreground"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span>Recent audit: {tickerItems[tickerIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={staggerItem}
            className="mt-6 flex flex-wrap items-center justify-center gap-6"
          >
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <badge.icon className="h-4 w-4 text-primary" />
                <span>{badge.label}</span>
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
