"use client";

import Balancer from "react-wrap-balancer";
import {
  ArrowRight,
  Play,
  Sparkles,
  ShieldCheck,
  Clock,
  CalendarCheck,
  XCircle,
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/layout/Container";
import { GradientButton } from "@/components/shared/GradientButton";
import { trackCTAClick, trackCtaClickConversion } from "@/lib/analytics";

/* ------------------------------------------------------------------ */
/*  Animated counter with framer-motion                                */
/* ------------------------------------------------------------------ */
function AnimatedStat({
  target,
  prefix = "",
  suffix = "",
  label,
  delay = 0,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
  delay?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, target, {
      duration: 2,
      delay,
      ease: "easeOut",
    });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [count, rounded, target, delay]);

  return (
    <div className="text-center">
      <p className="font-display text-3xl font-bold gradient-text sm:text-4xl">
        {prefix}
        {display}
        {suffix}
      </p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating particle field                                            */
/* ------------------------------------------------------------------ */
const PARTICLE_COUNT = 20;

function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const size = Math.random() * 3 + 1;
    return {
      size,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      bg: `rgba(${Math.random() > 0.5 ? "76,133,255" : "34,211,161"}, ${Math.random() * 0.4 + 0.1})`,
      yOffset: -30 - Math.random() * 40,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 3,
    };
  });
}

const INITIAL_PARTICLES = generateParticles();

function ParticleField() {
  const particles = useMemo(() => INITIAL_PARTICLES, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            background: p.bg,
          }}
          animate={{
            y: [0, p.yOffset, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated grid background                                           */
/* ------------------------------------------------------------------ */
function AnimatedGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(76,133,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(76,133,255,0.5) 1px, transparent 1px)",
        backgroundSize: "4rem 4rem",
        maskImage:
          "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Trust badge item                                                   */
/* ------------------------------------------------------------------ */
function TrustBadge({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0 text-green-400" />
      <span>{text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard mockup preview                                           */
/* ------------------------------------------------------------------ */
function DashboardPreview() {
  return (
    <motion.div
      className="relative mx-auto mt-16 max-w-3xl"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
    >
      {/* Glow effect behind the dashboard */}
      <div
        className="absolute -inset-4 rounded-2xl opacity-60 blur-3xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(76,133,255,0.2) 0%, rgba(34,211,161,0.15) 50%, rgba(76,133,255,0.2) 100%)",
        }}
      />

      {/* Dashboard card */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-2xl backdrop-blur-sm sm:p-6">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
            <div className="h-3 w-3 rounded-full bg-green-400/60" />
          </div>
          <span className="text-xs text-muted-foreground/50">
            Sovereign AI Dashboard
          </span>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <DashboardMetric
            label="Leads This Month"
            value="67"
            change="+347%"
            positive
          />
          <DashboardMetric
            label="Calls Answered"
            value="100%"
            change="24/7 AI"
            positive
          />
          <DashboardMetric
            label="Revenue"
            value="$48K"
            change="+215%"
            positive
          />
        </div>

        {/* Mini chart placeholder */}
        <div className="mt-4 flex h-16 items-end gap-1 rounded-lg bg-white/[0.02] p-2 sm:h-20">
          {[20, 35, 28, 45, 38, 55, 48, 62, 58, 72, 65, 85].map(
            (h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-[#4c85ff]/60 to-[#22d3a1]/60"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{
                  duration: 0.5,
                  delay: 0.8 + i * 0.05,
                  ease: "easeOut",
                }}
              />
            ),
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DashboardMetric({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 sm:p-3">
      <p className="text-[10px] text-muted-foreground/60 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-bold text-foreground sm:text-xl">
        {value}
      </p>
      <p
        className={`mt-0.5 text-[10px] font-medium sm:text-xs ${positive ? "text-green-400" : "text-red-400"}`}
      >
        {change}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stagger container                                                  */
/* ------------------------------------------------------------------ */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

/* ================================================================== */
/*  HeroSection                                                        */
/* ================================================================== */
interface HeroSectionProps {
  onCtaClick?: () => void;
  onDemoClick?: () => void;
}

export function HeroSection({ onCtaClick, onDemoClick }: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-[var(--bg-primary)]">
      {/* -- Premium background layers -- */}
      <AnimatedGrid />
      <ParticleField />

      {/* Radial gradient accents */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full will-change-transform hero-glow-blue"
        style={{
          background:
            "radial-gradient(circle, rgba(76,133,255,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full will-change-transform hero-glow-green"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,161,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Noise texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.03]" />

      {/* -- Trust bar -- */}
      <div className="relative z-10 border-b border-white/[0.06] backdrop-blur-md bg-white/[0.02]">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-3 text-xs sm:text-sm text-muted-foreground">
            <span>
              Built exclusively for{" "}
              <strong className="text-foreground">
                home service businesses
              </strong>
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span>
              <strong className="text-foreground">16 AI systems</strong> working
              24/7
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1">
              <strong className="text-foreground">60-day</strong> money-back
              guarantee
            </span>
          </div>
        </Container>
      </div>

      {/* -- Hero content -- */}
      <div className="relative z-10 py-16 sm:py-24 lg:py-32">
        <Container>
          <motion.div
            className="mx-auto max-w-4xl text-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Badge pill */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                Trusted by <strong className="text-foreground">500+</strong>{" "}
                home service businesses
              </span>
            </motion.div>

            {/* Eyebrow */}
            <motion.p
              variants={fadeUp}
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-widest text-primary"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Done-for-you AI marketing for home services
            </motion.p>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="mt-6 font-display text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              <Balancer>
                Every Missed Call Is a Job Your Competitor{" "}
                <span className="bg-gradient-to-r from-[#4c85ff] via-[#22d3a1] to-[#4c85ff] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite]">
                  Already Booked
                </span>
              </Balancer>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl"
            >
              Sovereign AI answers every call, books every lead, and fills your
              schedule 24/7 &mdash; so you stop leaving money on the table.
              Contractors go from 15 to 67+ leads per month in 30 days,
              guaranteed.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center"
            >
              <div className="flex flex-col items-stretch sm:items-center">
                <GradientButton
                  size="lg"
                  className="group btn-shine cta-glow px-8 py-4 text-base sm:px-10 sm:text-lg w-full sm:w-auto"
                  onClick={() => {
                    trackCTAClick("Start Getting More Leads", "homepage_hero");
                    trackCtaClickConversion("hero");
                    onCtaClick?.();
                  }}
                >
                  Start Getting More Leads
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </GradientButton>
                <span className="mt-2.5 text-xs sm:text-sm text-muted-foreground font-medium">
                  Free 15-min strategy call &mdash; No credit card required
                </span>
              </div>
              {onDemoClick && (
                <GradientButton
                  variant="outline"
                  size="lg"
                  className="group gap-2 w-full sm:w-auto"
                  onClick={() => {
                    trackCTAClick("Watch 2-Min Demo", "homepage_hero");
                    trackCtaClickConversion("hero");
                    onDemoClick?.();
                  }}
                >
                  <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Watch 2-Min Demo
                </GradientButton>
              )}
            </motion.div>

            {/* Trust badges row */}
            <motion.div
              variants={fadeUp}
              className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-8"
            >
              <TrustBadge icon={XCircle} text="No contracts" />
              <TrustBadge icon={ShieldCheck} text="60-day guarantee" />
              <TrustBadge icon={Clock} text="Setup in 48 hours" />
              <TrustBadge icon={CalendarCheck} text="Cancel anytime" />
            </motion.div>

            {/* Social proof counters */}
            <motion.div
              variants={fadeUp}
              className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 sm:gap-8"
            >
              <AnimatedStat
                target={500}
                suffix="+"
                label="Businesses"
                delay={0.5}
              />
              <AnimatedStat
                prefix="$"
                target={12}
                suffix="M+"
                label="Revenue Generated"
                delay={0.7}
              />
              <AnimatedStat
                target={4}
                suffix=".9/5"
                label="Avg. Rating"
                delay={0.9}
              />
            </motion.div>

            {/* Mini testimonial cards */}
            <motion.div
              variants={fadeUp}
              className="mx-auto mt-10 flex max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:gap-4"
            >
              {[
                {
                  quote: "Went from 12 to 54 leads/month in 6 weeks.",
                  author: "Mike R., HVAC contractor",
                },
                {
                  quote:
                    "Best ROI of any marketing we\u2019ve tried. Period.",
                  author: "Sarah T., plumbing company owner",
                },
              ].map((t) => (
                <motion.div
                  key={t.author}
                  className="group flex flex-1 items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="mt-0.5 shrink-0 text-amber-400">
                    &#9733;
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground/60">
                      &mdash; {t.author}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Dashboard preview with glow */}
          <DashboardPreview />
        </Container>
      </div>

      {/* Urgency ribbon */}
      <div className="relative z-10 border-t border-white/[0.06] bg-gradient-to-r from-amber-500/[0.06] via-amber-400/[0.1] to-amber-500/[0.06] backdrop-blur-sm">
        <Container>
          <div className="flex items-center justify-center gap-2 py-3 text-xs sm:text-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <span className="font-medium text-foreground">
              Limited spots available this month
            </span>
            <span className="hidden text-muted-foreground sm:inline">
              &mdash; We cap new clients to ensure white-glove onboarding
            </span>
          </div>
        </Container>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
    </section>
  );
}
