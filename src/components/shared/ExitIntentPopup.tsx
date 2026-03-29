"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Sparkles } from "lucide-react";

const SESSION_KEY = "exit-intent-shown";
const BOOKED_KEY = "has-booked";
const MOBILE_INACTIVITY_MS = 30_000;
const EXCLUDED_PATH_PREFIXES = ["/dashboard", "/admin"];

/**
 * Exit intent popup that detects when a user is about to leave:
 * - Desktop: mouse moves toward the top of the viewport
 * - Mobile: 30 seconds of inactivity (no scroll/touch)
 *
 * Only shown once per session; suppressed if the user has already booked.
 */
export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const pathname = usePathname();

  const isExcludedPage = EXCLUDED_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const shouldSuppress = useCallback((): boolean => {
    if (typeof window === "undefined") return true;
    if (sessionStorage.getItem(SESSION_KEY)) return true;
    if (localStorage.getItem(BOOKED_KEY)) return true;
    return false;
  }, []);

  const show = useCallback(() => {
    if (shouldSuppress()) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    triggerRef.current = document.activeElement;
    setVisible(true);

    import("posthog-js").then((mod) => {
      const ph = mod.default;
      if (ph.__loaded) {
        ph.capture("exit_intent_shown");
      }
    });
  }, [shouldSuppress]);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, []);

  const handleCtaClick = useCallback(() => {
    import("posthog-js").then((mod) => {
      const ph = mod.default;
      if (ph.__loaded) {
        ph.capture("exit_intent_clicked");
      }
    });
  }, []);

  // Desktop: detect mouse moving toward top of viewport
  useEffect(() => {
    if (isExcludedPage) return;
    if (typeof window === "undefined" || window.innerWidth < 768) return;

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) {
        show();
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isExcludedPage, show]);

  // Mobile: trigger after 30s of inactivity
  useEffect(() => {
    if (isExcludedPage) return;
    if (typeof window === "undefined" || window.innerWidth >= 768) return;

    let inactivityTimer: ReturnType<typeof setTimeout>;

    function resetTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        show();
      }, MOBILE_INACTIVITY_MS);
    }

    resetTimer();

    const events = ["scroll", "touchstart", "touchmove"] as const;
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [isExcludedPage, show]);

  // Focus close button when popup appears
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    }
  }, [visible]);

  // Escape key handler
  useEffect(() => {
    if (!visible) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, handleClose]);

  // Focus trap
  useEffect(() => {
    if (!visible || !dialogRef.current) return;
    const dialog = dialogRef.current;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [visible]);

  if (!visible || isExcludedPage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Free AI marketing audit offer"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full gradient-bg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-display text-xl font-bold">
            Wait! Get Your Free AI Marketing Audit
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            See exactly how AI can generate more leads for your business
            &mdash; no commitment required.
          </p>
        </div>

        <a
          href="/free-audit"
          onClick={handleCtaClick}
          className="block w-full rounded-lg gradient-bg py-3 text-center text-base font-semibold text-white shadow-lg transition hover:brightness-110 hover:shadow-[0_0_30px_rgba(76,133,255,0.3),0_0_60px_rgba(34,211,161,0.1)] active:scale-[0.98]"
        >
          Get My Free Audit
        </a>

        <button
          onClick={handleClose}
          className="mt-3 block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
