"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Layers,
  MessageSquare,
  UserPlus,
  Globe,
  ArrowRight,
  Phone,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/Confetti";
import { cn } from "@/lib/utils";
import { trackOnboardingStepCompleted, trackOnboardingAllComplete } from "@/lib/analytics";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "sovereign-onboarding-progress";
const DISMISSED_KEY = "sovereign-onboarding-dismissed";

interface OnboardingStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  autoComplete?: boolean;
}

const STEPS: OnboardingStep[] = [
  {
    id: "explore-dashboard",
    icon: LayoutDashboard,
    title: "Explore your dashboard",
    description:
      "Take a look around — your command center is ready.",
    ctaLabel: "You're here!",
    href: "/dashboard",
    autoComplete: true,
  },
  {
    id: "take-tour",
    icon: HelpCircle,
    title: "Take the guided tour",
    description:
      "Walk through the key areas of your dashboard with our interactive tour.",
    ctaLabel: "Start tour",
    href: "/dashboard?tour=1",
  },
  {
    id: "review-services",
    icon: Layers,
    title: "Review your active services",
    description:
      "See which AI services are live and working for you.",
    ctaLabel: "View services",
    href: "/dashboard/services",
  },
  {
    id: "setup-chatbot",
    icon: MessageSquare,
    title: "Set up your AI chatbot greeting",
    description:
      "Customize the first message visitors see on your site.",
    ctaLabel: "Configure chatbot",
    href: "/dashboard/services/chatbot",
  },
  {
    id: "add-lead",
    icon: UserPlus,
    title: "Add your first lead manually",
    description:
      "Start building your pipeline — add a prospect to your CRM.",
    ctaLabel: "New lead",
    href: "/dashboard/crm?action=new-lead",
  },
  {
    id: "connect-google",
    icon: Globe,
    title: "Connect your Google Business Profile",
    description:
      "Sync reviews, listings, and local SEO automatically.",
    ctaLabel: "Connect now",
    href: "/dashboard/settings/integrations",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* storage full — silent */
  }
}

function loadDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DISMISSED_KEY) === "true";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OnboardingChecklist() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(
    new Set(),
  );
  const [mounted, setMounted] = useState(false);
  const celebrationFired = useRef(false);

  /* Hydrate from localStorage on mount — setState is intentional here to
     synchronize component state with the external localStorage store. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadProgress();
    const wasDismissed = loadDismissed();

    /* Auto-complete the "explore dashboard" step on first visit */
    if (!stored["explore-dashboard"]) {
      stored["explore-dashboard"] = true;
      saveProgress(stored);
    }

    setProgress(stored);
    setDismissed(wasDismissed);
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const completedCount = STEPS.filter((s) => progress[s.id]).length;
  const totalSteps = STEPS.length;
  const allComplete = completedCount === totalSteps;
  const percent = Math.round((completedCount / totalSteps) * 100);

  /* Fire confetti exactly once when all steps complete — setState drives a
     one-shot visual effect that self-cleans via setTimeout. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (allComplete && mounted && !celebrationFired.current) {
      celebrationFired.current = true;
      trackOnboardingAllComplete();
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [allComplete, mounted]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleStep = useCallback(
    (stepId: string) => {
      const updated = { ...progress, [stepId]: !progress[stepId] };
      setProgress(updated);
      saveProgress(updated);

      if (!progress[stepId]) {
        trackOnboardingStepCompleted(stepId);
        setRecentlyCompleted((prev) => {
          const next = new Set(prev);
          next.add(stepId);
          return next;
        });
        setTimeout(() => {
          setRecentlyCompleted((prev) => {
            const next = new Set(prev);
            next.delete(stepId);
            return next;
          });
        }, 700);
      }
    },
    [progress],
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  }, []);

  /* Don't render until hydrated to avoid flicker */
  if (!mounted) return null;

  /* Fully dismissed — hide completely */
  if (dismissed && !allComplete) return null;

  /* All done — show celebration banner then auto-hide */
  if (allComplete) {
    return (
      <>
        <Confetti active={showConfetti} count={60} duration={3500} />
        <Card className="border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
          <CardContent className="relative p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-emerald-300">
                  Setup complete — you are all set!
                </h3>
                <p className="mt-0.5 text-xs text-emerald-400/70">
                  Your AI services are configured and working for you
                  24/7. Time to grow.
                </p>
              </div>
              <button
                onClick={() => {
                  const updated = { ...progress, __celebration_dismissed: true };
                  saveProgress(updated);
                  setDismissed(true);
                  localStorage.setItem(DISMISSED_KEY, "true");
                }}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
              >
                Dismiss
              </button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  /* Collapsed mini-reminder */
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="group flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-primary/10"
        aria-label="Expand onboarding checklist"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-bg text-[11px] font-bold text-white tabular-nums">
          {completedCount}/{totalSteps}
        </div>
        <span className="flex-1 text-sm font-medium text-foreground/80">
          Continue setting up your account
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {percent}%
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
        </div>
      </button>
    );
  }

  /* Full checklist card */
  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        {/* ---- Header ---- */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-bg text-xs font-bold text-white tabular-nums">
              {completedCount}/{totalSteps}
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Welcome! Let&apos;s get you set up
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Complete these steps to unlock the full power of your
                AI services.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Collapse checklist"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ---- Progress bar ---- */}
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Onboarding progress: ${percent}% complete`}
          >
            <div
              className="h-full rounded-full gradient-bg transition-all duration-500 ease-out progress-shine"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
            {percent}%
          </span>
        </div>

        {/* ---- Step list ---- */}
        <div className="mt-4 space-y-1" role="list">
          {STEPS.map((step) => {
            const done = !!progress[step.id];
            const justDone = recentlyCompleted.has(step.id);
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                role="listitem"
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2.5 transition-all duration-300",
                  justDone && "scale-[0.98] bg-emerald-500/5",
                  !justDone && "hover:bg-muted/50",
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Mark "${step.title}" as ${done ? "incomplete" : "complete"}`}
                >
                  {done ? (
                    <CheckCircle2
                      className={cn(
                        "h-5 w-5 text-emerald-400",
                        justDone && "check-bounce",
                      )}
                    />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
                  )}
                </button>

                {/* Icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    done
                      ? "bg-emerald-500/10"
                      : "bg-primary/10",
                  )}
                >
                  <StepIcon
                    className={cn(
                      "h-4 w-4",
                      done
                        ? "text-emerald-400/70"
                        : "text-primary",
                    )}
                  />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium transition-all duration-300",
                      done
                        ? "text-muted-foreground line-through"
                        : "text-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground/70 line-clamp-1">
                    {step.description}
                  </p>
                </div>

                {/* CTA button — only for incomplete, non-auto steps */}
                {!done && !step.autoComplete && (
                  <Link href={step.href} className="shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto min-h-0 gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      {step.ctaLabel}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}

                {/* Auto-completed badge */}
                {done && step.autoComplete && (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ---- Footer ---- */}
        <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={handleDismiss}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            I&apos;ll do this later
          </button>

          <a
            href="https://cal.com/sovereign-ai/onboarding"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Phone className="h-3 w-3" />
            Need help? Book a free onboarding call
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
