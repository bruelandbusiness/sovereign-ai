"use client";

import { useState } from "react";
import { Mail, ArrowRight, Check, Loader2 } from "lucide-react";
import { trackNewsletterSignup } from "@/lib/analytics";

export function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        trackNewsletterSignup();
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="my-10 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center sm:p-8">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="h-5 w-5 text-emerald-400" />
        </div>
        <h3 className="font-display text-lg font-bold">
          You&apos;re on the list.
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your inbox for a confirmation email. We send one tip per week --
          no spam, ever.
        </p>
      </div>
    );
  }

  return (
    <div className="my-10 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-[#22d3a1]/5 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-base font-bold sm:text-lg">
            Get AI Marketing Tips Every Week
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Join 2,300+ contractors getting one actionable AI marketing tip per
            week. Free, no spam, unsubscribe anytime.
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-lg gradient-bg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Subscribe
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
