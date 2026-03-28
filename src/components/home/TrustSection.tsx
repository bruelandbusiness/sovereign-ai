"use client";

import { Shield, Lock, Clock, Award, Headphones, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Container } from "@/components/layout/Container";
import { LogoMarquee } from "@/components/shared/LogoMarquee";

const TRUST_ITEMS = [
  {
    icon: Shield,
    label: "60-Day Money-Back Guarantee",
    description: "If you don't see results, we refund 100%",
  },
  {
    icon: Lock,
    label: "256-Bit Encryption",
    description: "Your data is secure and never shared",
  },
  {
    icon: Clock,
    label: "48-Hour Deployment",
    description: "All services live within 2 days",
  },
  {
    icon: Award,
    label: "93% Retention Rate",
    description: "Clients stay because it works",
  },
  {
    icon: Headphones,
    label: "Dedicated Support",
    description: "Human team + AI assistance 24/7",
  },
  {
    icon: Zap,
    label: "No Contracts",
    description: "Month-to-month, cancel anytime",
  },
];

const INTEGRATIONS = [
  { name: "Google Business Profile" },
  { name: "Stripe" },
  { name: "SendGrid" },
  { name: "Twilio" },
  { name: "HubSpot" },
  { name: "ServiceTitan" },
  { name: "Housecall Pro" },
  { name: "Jobber" },
  { name: "Meta Ads" },
  { name: "Google Ads" },
  { name: "QuickBooks" },
  { name: "Zapier" },
];

export function TrustSection() {
  const prefersReduced = useReducedMotion();
  const { ref: badgesRef, inView: badgesInView } = useInView({
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });
  const { ref: integrationsRef, inView: integrationsInView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const cardVariants = {
    hidden: prefersReduced
      ? { opacity: 1 }
      : { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: prefersReduced
        ? { duration: 0 }
        : {
            delay: i * 0.07,
            duration: 0.3,
            ease: "easeOut" as const,
          },
    }),
  };

  return (
    <section className="relative border-y border-white/[0.06] bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] py-16 overflow-hidden">
      <Container>
        {/* Trust badges */}
        <motion.div
          ref={badgesRef}
          className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
          initial="hidden"
          animate={badgesInView ? "visible" : "hidden"}
        >
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              variants={cardVariants}
              custom={i}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
              whileHover={{ y: -4 }}
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-xs font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-tight text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Integrations marquee */}
        <motion.div
          ref={integrationsRef}
          className="mt-14"
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={
            integrationsInView
              ? { opacity: 1, y: 0 }
              : prefersReduced
                ? { opacity: 1 }
                : { opacity: 0, y: 20 }
          }
          transition={
            prefersReduced
              ? { duration: 0 }
              : { delay: 0.15, duration: 0.35, ease: "easeOut" }
          }
        >
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Integrates With Your Existing Tools
          </p>
          <LogoMarquee logos={INTEGRATIONS} speed="normal" />
        </motion.div>
      </Container>
    </section>
  );
}
