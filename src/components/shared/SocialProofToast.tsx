"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const CITIES = [
  "Austin",
  "Phoenix",
  "Denver",
  "Atlanta",
  "Nashville",
  "Charlotte",
  "Tampa",
  "Dallas",
  "Orlando",
  "San Diego",
];

const NAMES = [
  "Mike",
  "Sarah",
  "David",
  "Jennifer",
  "Chris",
  "Amanda",
  "Brian",
  "Lisa",
  "Kevin",
  "Rachel",
];

const TIME_AGO = [
  "2 minutes ago",
  "5 minutes ago",
  "12 minutes ago",
  "1 hour ago",
  "3 hours ago",
];

const SESSION_KEY = "social-proof-dismissed";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMessage(): string {
  const templates = [
    () => `A plumber in ${pick(CITIES)} just signed up \u2014 ${pick(TIME_AGO)}`,
    () =>
      `${pick(NAMES)} from ${pick(CITIES)} booked a strategy call \u2014 ${pick(TIME_AGO)}`,
    () =>
      `An HVAC company just activated AI Lead Generation \u2014 ${pick(TIME_AGO)}`,
    () =>
      `${pick(NAMES)}\u2019s roofing business got 12 new leads this week`,
    () =>
      `A contractor in ${pick(CITIES)} just upgraded to the Empire Bundle \u2014 ${pick(TIME_AGO)}`,
  ];
  return pick(templates)();
}

function randomInterval(): number {
  return 15000 + Math.random() * 5000;
}

/** Marketing pages only — excluded path prefixes. */
const EXCLUDED_PREFIXES = ["/dashboard", "/admin", "/app", "/settings"];

function isMarketingPage(pathname: string): boolean {
  return !EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

export function SocialProofToast() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "true") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage may be unavailable
    }
  }, []);

  const showToast = useCallback(() => {
    setMessage(buildMessage());
    setVisible(true);

    // Auto-dismiss after 5 seconds
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 5000);
  }, []);

  const scheduleCycle = useCallback(() => {
    cycleTimerRef.current = setTimeout(() => {
      showToast();
    }, randomInterval());
  }, [showToast]);

  // When a toast hides, schedule the next one
  useEffect(() => {
    if (!visible && !dismissed && isMarketingPage(pathname)) {
      scheduleCycle();
    }
    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [visible, dismissed, pathname, scheduleCycle]);

  // Initial delay of 8 seconds
  useEffect(() => {
    if (dismissed || !isMarketingPage(pathname)) return;

    const initialTimer = setTimeout(() => {
      showToast();
    }, 8000);

    return () => clearTimeout(initialTimer);
    // Only run on mount / pathname change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, dismissed]);

  // Cleanup hide timer
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // sessionStorage may be unavailable
    }
  }, []);

  if (dismissed || !isMarketingPage(pathname)) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="fixed bottom-6 left-6 z-50 max-w-xs rounded-lg border bg-card p-4 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {/* Pulsing green dot */}
            <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>

            <p className="min-w-0 flex-1 text-sm leading-snug">
              {message}
            </p>

            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
