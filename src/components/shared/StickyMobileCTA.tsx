"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

/**
 * A sticky CTA bar that appears on mobile after scrolling past the hero.
 * Dismissible — stays hidden for the session after user closes it.
 */
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-md p-3 sticky-pulse md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-2">
        <Link
          href="/free-audit"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          Get My Free AI Audit
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        Free strategy call &middot; No credit card required
      </p>
    </div>
  );
}
