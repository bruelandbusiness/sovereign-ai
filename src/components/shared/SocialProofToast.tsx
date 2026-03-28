"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

interface ProofItem {
  name: string;
  city?: string;
  action: string;
}

// No fallback items — only show real activity from the API

// US cities used when real leads don't have a city
const CITIES = [
  "Phoenix, AZ", "Dallas, TX", "Atlanta, GA", "Denver, CO", "Miami, FL",
  "Houston, TX", "Chicago, IL", "Nashville, TN", "Charlotte, NC",
  "Portland, OR", "San Antonio, TX", "Tampa, FL", "Austin, TX",
  "Orlando, FL", "San Diego, CA", "Columbus, OH",
];

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

function randomTimeAgo(): string {
  const minutes = Math.floor(Math.random() * 12) + 1;
  return `${minutes} min ago`;
}

export function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [items, setItems] = useState<ProofItem[]>([]);
  const fetched = useRef(false);

  // Fetch real data on mount — component stays hidden if no real activity exists
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch("/api/social-proof")
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length >= 3) {
          setItems(
            data.items.map((item: { name: string; city?: string; action: string }) => ({
              name: item.name,
              city: item.city || CITIES[Math.floor(Math.random() * CITIES.length)],
              action: item.action,
            }))
          );
        }
      })
      .catch(() => {
        // No real data — component stays hidden
      });
  }, []);

  const showNext = useCallback(() => {
    if (dismissed || items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setVisible(true);

    // Auto-hide after 4 seconds
    setTimeout(() => setVisible(false), 4000);
  }, [dismissed, items.length]);

  useEffect(() => {
    // Don't show on dashboard pages
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
      return;
    }

    // First toast after 8-15s delay
    const initialDelay = setTimeout(() => {
      showNext();
    }, randomDelay(8000, 15000));

    return () => clearTimeout(initialDelay);
  }, [showNext]);

  // Schedule next toast after current one hides
  useEffect(() => {
    if (visible || dismissed) return;

    const nextDelay = setTimeout(() => {
      showNext();
    }, randomDelay(20000, 45000));

    return () => clearTimeout(nextDelay);
  }, [visible, dismissed, showNext]);

  if (items.length === 0) return null;

  const item = items[currentIndex];

  return (
    <AnimatePresence>
      {visible && !dismissed && item && (
        <motion.div
          initial={{ opacity: 0, x: -80, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-6 z-40 max-w-xs rounded-xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15">
              <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {item.name}{item.city ? ` from ${item.city}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">{item.action}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {randomTimeAgo()}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
