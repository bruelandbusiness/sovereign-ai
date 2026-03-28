"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { GradientButton } from "./GradientButton";
import { trackExitIntentConversion } from "@/lib/tracking";

const COOKIE_NAME = "sai_exit_shown";
const COOKIE_DAYS = 7;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const emailError =
    emailTouched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Please enter a valid email address"
      : "";

  const handleClose = useCallback(() => {
    setVisible(false);
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !getCookie(COOKIE_NAME)) {
      triggerRef.current = document.activeElement;
      setVisible(true);
      setCookie(COOKIE_NAME, "1", COOKIE_DAYS);
    }
  }, []);

  useEffect(() => {
    // Only desktop -- mobile doesn't have mouse leave
    if (window.innerWidth < 768) return;

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000); // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  // Focus the close button when popup appears
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || emailError || isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/funnel-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Visitor",
          email: email.trim().toLowerCase(),
          source: "free-audit",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      trackExitIntentConversion();
      setSubmitted(true);
    } catch {
      // Still show success to avoid blocking the user
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Free AI marketing audit offer"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-2xl">
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-display text-xl font-bold">Check Your Inbox!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;re preparing your free AI marketing audit. You&apos;ll receive it
              within 5 minutes.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full gradient-bg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold">
                Wait — Get Your Free AI Audit
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                See exactly how AI can grow your business. Free, instant, no
                obligation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="exit-intent-email" className="sr-only">Email address</label>
                <input
                  id="exit-intent-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "exit-email-error" : undefined}
                  className={`w-full rounded-lg border bg-background px-4 py-3 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm ${
                    emailError ? "border-red-500/50" : "border-border"
                  }`}
                />
                {emailError && (
                  <p id="exit-email-error" className="mt-1 text-xs text-red-400">{emailError}</p>
                )}
              </div>
              <GradientButton
                type="submit"
                className="w-full btn-shine"
                size="lg"
                disabled={isSubmitting || !!emailError}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Get My Free Audit"
                )}
              </GradientButton>
            </form>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              No spam. No credit card. Takes 60 seconds.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
