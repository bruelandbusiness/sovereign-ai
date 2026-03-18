"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Sparkles } from "lucide-react";
import { GradientButton } from "./GradientButton";

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
  const [submitted, setSubmitted] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !getCookie(COOKIE_NAME)) {
      setVisible(true);
      setCookie(COOKIE_NAME, "1", COOKIE_DAYS);
    }
  }, []);

  useEffect(() => {
    // Only desktop — mobile doesn't have mouse leave
    if (window.innerWidth < 768) return;

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000); // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // In production, this would call an API to save the lead
    setSubmitted(true);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-2xl">
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <GradientButton type="submit" className="w-full btn-shine" size="lg">
                Get My Free Audit
              </GradientButton>
            </form>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              No spam. No credit card. Takes 60 seconds.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
