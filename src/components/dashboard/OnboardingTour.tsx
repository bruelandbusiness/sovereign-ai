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
  Zap,
  Users,
  FileText,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "onboarding-tour-complete";

interface OnboardingStep {
  /** Matches data-tour="step-N" on the target element */
  target: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: OnboardingStep[] = [
  {
    target: "step-1",
    title: "Welcome to your dashboard!",
    description:
      "These KPI cards show your most important metrics at a glance — leads, conversion rate, revenue, and engagement. They update in real time as your AI services work.",
    icon: Sparkles,
  },
  {
    target: "step-2",
    title: "Your AI services",
    description:
      "Manage all your AI-powered services from here. Activate new services, check their status, and jump into individual service dashboards to fine-tune performance.",
    icon: Zap,
  },
  {
    target: "step-3",
    title: "Track your leads",
    description:
      "Every incoming lead captured by your AI services appears here. View details, update statuses, and take action to close deals faster.",
    icon: Users,
  },
  {
    target: "step-4",
    title: "View your reports",
    description:
      "Dive into weekly and monthly reports with interactive charts. Track trends, compare lead sources, and measure ROI across all of your services.",
    icon: FileText,
  },
  {
    target: "step-5",
    title: "Need help?",
    description:
      "Our support team is here for you. Create tickets, browse documentation, or book a call with an onboarding specialist whenever you need assistance.",
    icon: Headphones,
  },
];

/* ------------------------------------------------------------------ */
/*  Local-storage helpers                                              */
/* ------------------------------------------------------------------ */

function isComplete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function markComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    /* quota exceeded — silent */
  }
}

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

function getRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  return el ? el.getBoundingClientRect() : null;
}

type Placement = "top" | "bottom" | "left" | "right";

interface TooltipPos {
  top: number;
  left: number;
  placement: Placement;
}

function clampH(left: number, w: number, pad: number): number {
  return Math.max(pad, Math.min(left, window.innerWidth - w - pad));
}

function clampV(top: number, h: number, pad: number): number {
  return Math.max(pad, Math.min(top, window.innerHeight - h - pad));
}

function calcPosition(
  rect: DOMRect | null,
  tw: number,
  th: number,
): TooltipPos {
  if (!rect) {
    return {
      top: window.innerHeight / 2 - th / 2,
      left: window.innerWidth / 2 - tw / 2,
      placement: "bottom",
    };
  }

  const gap = 14;
  const pad = 12;

  /* Prefer bottom */
  if (window.innerHeight - rect.bottom >= th + gap) {
    return {
      top: rect.bottom + gap,
      left: clampH(rect.left + rect.width / 2 - tw / 2, tw, pad),
      placement: "bottom",
    };
  }
  /* Top */
  if (rect.top >= th + gap) {
    return {
      top: rect.top - th - gap,
      left: clampH(rect.left + rect.width / 2 - tw / 2, tw, pad),
      placement: "top",
    };
  }
  /* Right */
  if (window.innerWidth - rect.right >= tw + gap) {
    return {
      top: clampV(rect.top + rect.height / 2 - th / 2, th, pad),
      left: rect.right + gap,
      placement: "right",
    };
  }
  /* Left (fallback) */
  return {
    top: clampV(rect.top + rect.height / 2 - th / 2, th, pad),
    left: Math.max(pad, rect.left - tw - gap),
    placement: "left",
  };
}

/* ------------------------------------------------------------------ */
/*  Spotlight overlay (SVG mask)                                       */
/* ------------------------------------------------------------------ */

function Spotlight({ rect }: { rect: DOMRect | null }) {
  if (!rect) {
    return (
      <div className="fixed inset-0 z-[9990] bg-black/55 transition-opacity duration-300" />
    );
  }

  const p = 8;
  const x = rect.left - p;
  const y = rect.top - p;
  const w = rect.width + p * 2;
  const h = rect.height + p * 2;
  const r = 10;

  return (
    <svg
      className="fixed inset-0 z-[9990] h-full w-full"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <mask id="onboarding-spotlight">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="black" />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.55)"
        mask="url(#onboarding-spotlight)"
        style={{ pointerEvents: "all" }}
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        ry={r}
        fill="none"
        stroke="rgba(99,140,255,0.45)"
        strokeWidth="2"
        className="animate-pulse"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Arrow pointing to target                                           */
/* ------------------------------------------------------------------ */

function Arrow({ placement }: { placement: Placement }) {
  const base =
    "absolute h-3 w-3 rotate-45 bg-card border border-border";

  const styles: Record<Placement, { className: string; style: CSSProperties }> =
    {
      bottom: {
        className: cn(base, "border-b-0 border-r-0"),
        style: { top: -6, left: "50%", marginLeft: -6 },
      },
      top: {
        className: cn(base, "border-t-0 border-l-0"),
        style: { bottom: -6, left: "50%", marginLeft: -6 },
      },
      right: {
        className: cn(base, "border-r-0 border-t-0"),
        style: { left: -6, top: "50%", marginTop: -6 },
      },
      left: {
        className: cn(base, "border-l-0 border-b-0"),
        style: { right: -6, top: "50%", marginTop: -6 },
      },
    };

  const { className, style } = styles[placement];
  return <div className={className} style={style} />;
}

/* ------------------------------------------------------------------ */
/*  OnboardingTour                                                     */
/* ------------------------------------------------------------------ */

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const [placement, setPlacement] = useState<Placement>("bottom");
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = STEPS[step];
  const total = STEPS.length;
  const Icon = current?.icon ?? Sparkles;

  /* ---- Hydrate + auto-start for first-time users ---- */
  useEffect(() => {
    setMounted(true);
    if (!isComplete()) {
      const t = setTimeout(() => setActive(true), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  /* ---- Position update logic ---- */
  const reposition = useCallback(() => {
    if (!active || !current) return;

    const r = getRect(current.target);
    setRect(r);

    if (r) {
      const el = document.querySelector(
        `[data-tour="${current.target}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    requestAnimationFrame(() => {
      const updated = getRect(current.target);
      setRect(updated);

      const tw = 350;
      const th = 230;
      const pos = calcPosition(updated, tw, th);

      setStyle({
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9991,
        width: tw,
      });
      setPlacement(pos.placement);
    });
  }, [active, current]);

  /* Re-position when step changes */
  useEffect(() => {
    if (!active) return;
    setAnimating(true);
    const t = setTimeout(() => {
      reposition();
      setAnimating(false);
    }, 60);
    return () => clearTimeout(t);
  }, [step, active, reposition]);

  /* Re-position on resize / scroll */
  useEffect(() => {
    if (!active) return;
    function handle() {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(reposition, 120);
    }
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
    };
  }, [active, reposition]);

  /* Lock scroll while active */
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  /* ---- Navigation handlers ---- */
  const finish = useCallback(() => {
    markComplete();
    setActive(false);
  }, []);

  const skip = useCallback(() => {
    markComplete();
    setActive(false);
  }, []);

  const next = useCallback(() => {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }, [step, total, finish]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  /* Keyboard: Escape, ArrowRight/Enter, ArrowLeft */
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, skip, next, prev]);

  /* ---- Render ---- */
  if (!mounted || !active) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding tour: step ${step + 1} of ${total}`}
    >
      {/* Dimmed overlay with spotlight cutout */}
      <Spotlight rect={rect} />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className={cn(
          "rounded-xl border border-border bg-card shadow-2xl shadow-black/20",
          "transition-all duration-300 ease-out",
          animating ? "scale-95 opacity-0" : "scale-100 opacity-100",
        )}
        style={style}
      >
        {rect && <Arrow placement={placement} />}

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  Step {step + 1} of {total}
                </p>
                <h3 className="text-sm font-bold text-foreground">
                  {current.title}
                </h3>
              </div>
            </div>
            <button
              onClick={skip}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {current.description}
          </p>

          {/* Progress dots */}
          <div
            className="mt-4 flex items-center justify-center gap-1.5"
            role="tablist"
            aria-label="Tour progress"
          >
            {STEPS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === step}
                aria-label={`Go to step ${i + 1}`}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === step
                    ? "w-6 bg-primary"
                    : i < step
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20",
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={skip}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prev}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={next}
                className="gap-1 text-xs"
              >
                {step === total - 1 ? (
                  "Finish"
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
