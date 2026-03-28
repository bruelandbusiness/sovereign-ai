"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Rocket,
  Shield,
  Zap,
  Bot,
  Star,
  BarChart3,
  CalendarDays,
  Mail,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import { Confetti } from "@/components/ui/Confetti";
import { AnimatedProgressBar } from "@/components/ui/AnimatedProgressBar";
import { Card, CardContent } from "@/components/ui/card";
import { trackCheckoutSuccess } from "@/lib/analytics";

/* ------------------------------------------------------------------ */
/*  Service activation data                                           */
/* ------------------------------------------------------------------ */

interface ServiceItem {
  name: string;
  icon: React.ReactNode;
  activationDelay: number; // ms before "active"
}

const SERVICES: ServiceItem[] = [
  { name: "AI Chatbot", icon: <Bot className="h-4 w-4" />, activationDelay: 1800 },
  { name: "Review Management", icon: <Star className="h-4 w-4" />, activationDelay: 3200 },
  { name: "Lead Generation", icon: <Zap className="h-4 w-4" />, activationDelay: 4800 },
  { name: "Analytics Dashboard", icon: <BarChart3 className="h-4 w-4" />, activationDelay: 6000 },
  { name: "Weekly Reports", icon: <CalendarDays className="h-4 w-4" />, activationDelay: 7200 },
];

/* ------------------------------------------------------------------ */
/*  Timeline step data                                                */
/* ------------------------------------------------------------------ */

interface TimelineStepData {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive?: boolean;
}

const TIMELINE_STEPS: TimelineStepData[] = [
  {
    icon: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    title: "Your AI services are activating now",
    description: "We're deploying and configuring your full marketing stack.",
    isActive: true,
  },
  {
    icon: <Rocket className="h-4 w-4 text-primary" />,
    title: "Dashboard is ready -- explore your tools",
    description: "Your personalized dashboard is live with all controls.",
  },
  {
    icon: <CalendarDays className="h-4 w-4 text-primary" />,
    title: "First AI-generated leads in 3-7 days",
    description: "Our AI begins prospecting and qualifying leads for you automatically.",
  },
  {
    icon: <BarChart3 className="h-4 w-4 text-primary" />,
    title: "Your first weekly report arrives next Monday",
    description: "Full performance insights delivered to your inbox every week.",
  },
];

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const planName = searchParams.get("plan") ?? "Growth";

  const [showConfetti, setShowConfetti] = useState(true);
  const [activatedServices, setActivatedServices] = useState<Set<number>>(
    new Set()
  );
  const [overallProgress, setOverallProgress] = useState(0);

  /* Track checkout success */
  useEffect(() => {
    trackCheckoutSuccess(planName, sessionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Turn off confetti after burst */
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  /* Stagger-activate each service */
  const activateService = useCallback((index: number) => {
    setActivatedServices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  useEffect(() => {
    const timers = SERVICES.map((service, index) =>
      setTimeout(() => {
        activateService(index);
        setOverallProgress(
          Math.round(((index + 1) / SERVICES.length) * 100)
        );
      }, service.activationDelay)
    );
    return () => timers.forEach(clearTimeout);
  }, [activateService]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Confetti active={showConfetti} count={120} duration={5000} />
      <Header variant="minimal" />

      <main className="flex-1 py-12 sm:py-20">
        <Container>
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            {/* ---- Animated checkmark ---- */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 12,
                delay: 0.1,
              }}
              className="mb-8"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex h-28 w-28 items-center justify-center rounded-full bg-green-500/10"
                  style={{
                    boxShadow:
                      "0 0 60px rgba(34, 197, 94, 0.25), 0 0 120px rgba(34, 197, 94, 0.1)",
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.4,
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                    }}
                  >
                    <CheckCircle2 className="h-14 w-14 text-green-500" />
                  </motion.div>
                </motion.div>
                {/* Expanding ring animations */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ delay: 0.5, duration: 1.2 }}
                  className="absolute inset-0 rounded-full border-2 border-green-500/30"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2.0, opacity: 0 }}
                  transition={{ delay: 0.7, duration: 1.4 }}
                  className="absolute inset-0 rounded-full border border-green-500/15"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ delay: 0.9, duration: 1.6 }}
                  className="absolute inset-0 rounded-full border border-primary/10"
                />
              </div>
            </motion.div>

            {/* ---- Heading ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h1 className="font-display text-4xl font-bold sm:text-5xl">
                <GradientText>Welcome to Sovereign AI!</GradientText>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Your <span className="font-semibold text-foreground">{planName} Plan</span> is
                confirmed. We are deploying your AI marketing systems right now.
              </p>
            </motion.div>

            {/* ---- Guarantee + Trial badge ---- */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-5 py-2.5"
            >
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-400">
                14-day free trial active &middot; 60-day money-back guarantee
              </span>
            </motion.div>

            {/* ---- Service Activation Progress ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-10 w-full"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-2 pb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      Service Activation
                    </p>
                  </div>

                  <AnimatedProgressBar
                    value={overallProgress}
                    variant="gradient"
                    size="md"
                    label="Deploying your AI stack"
                    className="mt-3 mb-5"
                  />

                  <div className="flex flex-col gap-3">
                    {SERVICES.map((service, index) => {
                      const isActive = activatedServices.has(index);
                      return (
                        <motion.div
                          key={service.name}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.9 + index * 0.1,
                            duration: 0.4,
                          }}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                              {service.icon}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {service.name}
                            </span>
                          </div>
                          <AnimatePresence mode="wait">
                            {isActive ? (
                              <motion.div
                                key="active"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 15,
                                }}
                                className="flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-xs font-semibold text-green-400">
                                  Active
                                </span>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="configuring"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5"
                              >
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Configuring...
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ---- What Happens Next timeline ---- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="mt-6 w-full"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-2 pb-4">
                    <Rocket className="h-5 w-5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      What happens next
                    </p>
                  </div>
                  <div className="flex flex-col gap-0">
                    {TIMELINE_STEPS.map((step, index) => (
                      <TimelineStep
                        key={step.title}
                        step={index + 1}
                        icon={step.icon}
                        title={step.title}
                        description={step.description}
                        isLast={index === TIMELINE_STEPS.length - 1}
                        animDelay={1.1 + index * 0.15}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ---- Email reminder ---- */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="mt-6 flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-5 py-3"
            >
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Check your email for your{" "}
                <span className="font-medium text-foreground">
                  welcome guide
                </span>{" "}
                with tips to get the most from your plan.
              </p>
            </motion.div>

            {/* ---- CTAs ---- */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
            >
              <Link href="/dashboard">
                <GradientButton size="lg" className="min-w-[240px] text-base">
                  Go to Your Dashboard
                  <ArrowRight className="h-5 w-5" />
                </GradientButton>
              </Link>
              <Link
                href="/onboarding-call"
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Book your free onboarding call
              </Link>
            </motion.div>

            {/* ---- Support footer ---- */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.9, duration: 0.5 }}
              className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <p>
                Questions? Reply to your welcome email or{" "}
                <Link
                  href="/support"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  chat with us
                </Link>
                .
              </p>
            </motion.div>

            {/* ---- Session ID (debug) ---- */}
            {sessionId && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0, duration: 0.5 }}
                className="mt-6 text-xs text-muted-foreground/50"
              >
                Session: {sessionId.slice(0, 20)}...
              </motion.p>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline step component                                           */
/* ------------------------------------------------------------------ */

function TimelineStep({
  step,
  icon,
  title,
  description,
  isLast,
  animDelay,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast: boolean;
  animDelay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animDelay, duration: 0.4 }}
      className="flex items-start gap-3"
    >
      {/* Vertical connector line + step circle */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {step}
        </div>
        {!isLast && (
          <div className="my-1 h-8 w-px bg-border/60" />
        )}
      </div>

      {/* Content */}
      <div className={isLast ? "pb-0" : "pb-4"}>
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {title}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
