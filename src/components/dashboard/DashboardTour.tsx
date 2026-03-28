"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Users,
  Layers,
  FileText,
  Settings,
  Headphones,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOUR_COMPLETED_KEY = "sovereign-tour-completed";
const TOUR_FIRST_VISIT_KEY = "sovereign-tour-first-visit";

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "welcome",
    title: "Welcome to Your Dashboard",
    description:
      "This is your command center. Everything you need to manage your AI-powered business is right here. Let us show you around!",
    icon: Sparkles,
  },
  {
    target: "kpis",
    title: "Key Performance Indicators",
    description:
      "Track your most important metrics at a glance — leads, conversion rate, revenue, and engagement. These update in real time as your AI services work for you.",
    icon: BarChart3,
  },
  {
    target: "leads",
    title: "Lead Pipeline",
    description:
      "See every incoming lead captured by your AI services. Click any lead to view details, update their status, or take action to close the deal.",
    icon: Users,
  },
  {
    target: "services",
    title: "Active Services",
    description:
      "Monitor which AI services are running for your business. You can configure, activate, or learn more about each service from here.",
    icon: Layers,
  },
  {
    target: "reports",
    title: "Reports & Analytics",
    description:
      "Dive deeper into your data with interactive charts. Track trends over time, compare lead sources, and measure your ROI across all services.",
    icon: FileText,
  },
  {
    target: "settings",
    title: "Billing & Settings",
    description:
      "Manage your subscription, update billing information, and configure account preferences. Everything is just one click away.",
    icon: Settings,
  },
  {
    target: "support",
    title: "Get Support",
    description:
      "Our team is here to help. Create support tickets, access documentation, or book a call with our onboarding specialists anytime.",
    icon: Headphones,
  },
  {
    target: "quick-actions",
    title: "Quick Actions",
    description:
      "Use these shortcuts to jump to common tasks — add a lead, create an invoice, view reports, or contact support. You are all set!",
    icon: HelpCircle,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isTourCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
}

function markTourCompleted(): void {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
  } catch {
    /* storage full — silent */
  }
}

function isFirstVisit(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TOUR_FIRST_VISIT_KEY) !== "true";
}

function markVisited(): void {
  try {
    localStorage.setItem(TOUR_FIRST_VISIT_KEY, "true");
  } catch {
    /* storage full — silent */
  }
}

/** Compute the bounding rect of a tour target element. */
function getTargetRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour-step="${target}"]`);
  if (!el) return null;
  return el.getBoundingClientRect();
}

/* ------------------------------------------------------------------ */
/*  Spotlight Overlay                                                  */
/* ------------------------------------------------------------------ */

interface SpotlightProps {
  rect: DOMRect | null;
}

function SpotlightOverlay({ rect }: SpotlightProps) {
  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300"
        style={{ opacity: 1 }}
      />
    );
  }

  const padding = 8;
  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = 12;

  return (
    <svg
      className="fixed inset-0 z-[9998] h-full w-full transition-all duration-300"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <mask id="tour-spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={r}
            ry={r}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.6)"
        mask="url(#tour-spotlight-mask)"
        style={{ pointerEvents: "all" }}
      />
      {/* Glow ring around spotlight */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        ry={r}
        fill="none"
        stroke="rgba(76,133,255,0.4)"
        strokeWidth="2"
        className="animate-pulse"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip / Popover                                                  */
/* ------------------------------------------------------------------ */

type Placement = "top" | "bottom" | "left" | "right";

interface TooltipPosition {
  top: number;
  left: number;
  placement: Placement;
}

function computeTooltipPosition(
  rect: DOMRect | null,
  tooltipWidth: number,
  tooltipHeight: number,
): TooltipPosition {
  /* When there is no target, center the tooltip on screen */
  if (!rect) {
    return {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - tooltipWidth / 2,
      placement: "bottom",
    };
  }

  const gap = 16;
  const padding = 16;

  /* Try bottom first */
  const bottomSpace = window.innerHeight - rect.bottom;
  if (bottomSpace >= tooltipHeight + gap) {
    return {
      top: rect.bottom + gap,
      left: clampHorizontal(
        rect.left + rect.width / 2 - tooltipWidth / 2,
        tooltipWidth,
        padding,
      ),
      placement: "bottom",
    };
  }

  /* Try top */
  if (rect.top >= tooltipHeight + gap) {
    return {
      top: rect.top - tooltipHeight - gap,
      left: clampHorizontal(
        rect.left + rect.width / 2 - tooltipWidth / 2,
        tooltipWidth,
        padding,
      ),
      placement: "top",
    };
  }

  /* Try right */
  const rightSpace = window.innerWidth - rect.right;
  if (rightSpace >= tooltipWidth + gap) {
    return {
      top: clampVertical(
        rect.top + rect.height / 2 - tooltipHeight / 2,
        tooltipHeight,
        padding,
      ),
      left: rect.right + gap,
      placement: "right",
    };
  }

  /* Fallback: left */
  return {
    top: clampVertical(
      rect.top + rect.height / 2 - tooltipHeight / 2,
      tooltipHeight,
      padding,
    ),
    left: Math.max(padding, rect.left - tooltipWidth - gap),
    placement: "left",
  };
}

function clampHorizontal(
  left: number,
  width: number,
  padding: number,
): number {
  return Math.max(padding, Math.min(left, window.innerWidth - width - padding));
}

function clampVertical(
  top: number,
  height: number,
  padding: number,
): number {
  return Math.max(
    padding,
    Math.min(top, window.innerHeight - height - padding),
  );
}

/* ------------------------------------------------------------------ */
/*  Arrow indicator                                                    */
/* ------------------------------------------------------------------ */

function ArrowIndicator({ placement }: { placement: Placement }) {
  const baseClasses =
    "absolute h-3 w-3 rotate-45 bg-card border border-border";

  switch (placement) {
    case "bottom":
      return (
        <div
          className={cn(baseClasses, "border-b-0 border-r-0")}
          style={{ top: -6, left: "50%", marginLeft: -6 }}
        />
      );
    case "top":
      return (
        <div
          className={cn(baseClasses, "border-t-0 border-l-0")}
          style={{ bottom: -6, left: "50%", marginLeft: -6 }}
        />
      );
    case "right":
      return (
        <div
          className={cn(baseClasses, "border-r-0 border-t-0")}
          style={{ left: -6, top: "50%", marginTop: -6 }}
        />
      );
    case "left":
      return (
        <div
          className={cn(baseClasses, "border-l-0 border-b-0")}
          style={{ right: -6, top: "50%", marginTop: -6 }}
        />
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

interface DashboardTourProps {
  /** Force the tour open even if completed before */
  forceOpen?: boolean;
  /** Callback when tour finishes or is skipped */
  onComplete?: () => void;
}

export function DashboardTour({ forceOpen, onComplete }: DashboardTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [placement, setPlacement] = useState<Placement>("bottom");
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = TOUR_STEPS[currentStep];
  const totalSteps = TOUR_STEPS.length;
  const StepIcon = step?.icon ?? Sparkles;

  /* Hydrate and auto-start on first visit */
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- hydration guard requires synchronous mount detection
    if (forceOpen) {
      setIsActive(true);
      setCurrentStep(0);
      return;
    }
    if (isFirstVisit() && !isTourCompleted()) {
      markVisited();
      /* Small delay so the dashboard has time to render its elements */
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [forceOpen]);

  /* Update spotlight and tooltip position when step changes */
  const updatePosition = useCallback(() => {
    if (!isActive || !step) return;
    const rect = getTargetRect(step.target);
    setTargetRect(rect);

    /* Scroll target into view if needed */
    if (rect) {
      const el = document.querySelector(
        `[data-tour-step="${step.target}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    /* Compute tooltip placement after a frame so scrollIntoView settles */
    requestAnimationFrame(() => {
      const updatedRect = getTargetRect(step.target);
      setTargetRect(updatedRect);

      const tooltipWidth = 360;
      const tooltipHeight = 240;
      const pos = computeTooltipPosition(
        updatedRect,
        tooltipWidth,
        tooltipHeight,
      );
      setTooltipStyle({
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: tooltipWidth,
      });
      setPlacement(pos.placement);
    });
  }, [isActive, step]);

  useEffect(() => {
    if (!isActive) return;
    setIsAnimating(true); // eslint-disable-line react-hooks/set-state-in-effect -- synchronous animation flag before async position update
    const timer = setTimeout(() => {
      updatePosition();
      setIsAnimating(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [currentStep, isActive, updatePosition]);

  /* Reposition on resize / scroll */
  useEffect(() => {
    if (!isActive) return;

    function handleResize() {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(updatePosition, 100);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
    };
  }, [isActive, updatePosition]);

  /* Lock body scroll when tour is active */
  useEffect(() => {
    if (!isActive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isActive]);

  const handleSkip = useCallback(() => {
    markTourCompleted();
    setIsActive(false);
    onComplete?.();
  }, [onComplete]);

  const handleFinish = useCallback(() => {
    markTourCompleted();
    setIsActive(false);
    onComplete?.();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleFinish();
    }
  }, [currentStep, totalSteps, handleFinish]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  /* Keyboard navigation */
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, handleSkip, handleNext, handlePrev]);

  if (!mounted || !isActive) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Dashboard tour: step ${currentStep + 1} of ${totalSteps}`}
    >
      {/* Overlay with spotlight cutout */}
      <SpotlightOverlay rect={targetRect} />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={cn(
          "rounded-xl border border-border bg-card shadow-2xl shadow-black/20",
          "transition-all duration-300 ease-out",
          isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100",
        )}
        style={tooltipStyle}
      >
        {/* Arrow */}
        {targetRect && <ArrowIndicator placement={placement} />}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <StepIcon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  Step {currentStep + 1} of {totalSteps}
                </p>
                <h3 className="text-sm font-bold text-foreground">
                  {step.title}
                </h3>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {/* Progress dots */}
          <div
            className="mt-4 flex items-center justify-center gap-1.5"
            role="tablist"
            aria-label="Tour progress"
          >
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === currentStep}
                aria-label={`Go to step ${i + 1}`}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === currentStep
                    ? "w-6 bg-primary"
                    : i < currentStep
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20",
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={handleSkip}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                className="gap-1 text-xs"
              >
                {currentStep === totalSteps - 1 ? (
                  "Finish Tour"
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  "Take a Tour" trigger button (for embedding in other components)   */
/* ------------------------------------------------------------------ */

export function TakeTourButton({
  className,
}: {
  className?: string;
}) {
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn("gap-1.5 text-xs", className)}
        onClick={() => setShowTour(true)}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Take a Tour
      </Button>
      {showTour && (
        <DashboardTour
          forceOpen
          onComplete={() => setShowTour(false)}
        />
      )}
    </>
  );
}
