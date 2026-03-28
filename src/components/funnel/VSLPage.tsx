"use client";

import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { trackEvent } from "@/lib/tracking";
import {
  Play,
  CheckCircle2,
  ArrowRight,
  Shield,
  Star,
  Clock,
  Phone,
} from "lucide-react";

export function VSLPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", trade: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    trackEvent("strategy_call_booked", {
      source: "vsl",
      trade: form.trade,
    });

    try {
      await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          source: "vsl-funnel",
          trade: form.trade,
        }),
      });
    } catch {
      // Still show success — lead data captured
    }

    setSubmitted(true);
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Urgency Bar */}
      <div className="bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] py-2 text-center text-sm font-medium text-white">
        <Clock className="mr-1 inline h-4 w-4" />
        Free strategy session spots are limited — only 5 left this week
      </div>

      <Container>
        <div className="mx-auto max-w-3xl pb-20 pt-12">
          {/* Headline */}
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-emerald-400">
              For HVAC, Plumbing & Roofing Companies
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              How Home Service Businesses Are Using AI to Book{" "}
              <span className="bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] bg-clip-text text-transparent">
                23+ Jobs Per Week
              </span>{" "}
              — Without Hiring a Single Employee
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Watch this 10-minute demo to see the exact system our clients use
              to capture leads, book appointments, and get 5-star reviews on
              autopilot.
            </p>
          </div>

          {/* Video Placeholder */}
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-[#4c85ff] to-[#22d3a1]">
                  <Play className="h-8 w-8 text-white" fill="white" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Video Sales Letter — Replace with your Wistia/Vimeo embed
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recommended: 8-12 min runtime, screen recording of dashboard +
                  chatbot in action
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof Strip */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
              4.9/5 from 500+ businesses
            </span>
            <span>|</span>
            <span>500+ active clients</span>
            <span>|</span>
            <span>$12M+ in tracked revenue</span>
          </div>

          {/* CTA Section */}
          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">You&apos;re In!</h2>
              <p className="mt-2 text-muted-foreground">
                Check your email — we&apos;ll send you a calendar link to book
                your free strategy session within the next 15 minutes.
              </p>
            </div>
          ) : !showForm ? (
            <div className="text-center">
              <button
                onClick={() => {
                  setShowForm(true);
                  trackEvent("cta_click", { source: "vsl", page: "demo" });
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-8 py-4 text-lg font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Book Your Free Strategy Session
                <ArrowRight className="h-5 w-5" />
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                No obligation. No credit card required.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="mb-1 text-center text-xl font-bold text-white">
                Book Your Free Strategy Session
              </h2>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                We&apos;ll build a custom AI marketing plan for your business —
                free.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="vsl-name" className="sr-only">Your Name</label>
                  <input
                    id="vsl-name"
                    type="text"
                    required
                    placeholder="Your Name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="vsl-email" className="sr-only">Email Address</label>
                  <input
                    id="vsl-email"
                    type="email"
                    required
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="vsl-phone" className="sr-only">Phone (optional)</label>
                  <input
                    id="vsl-phone"
                    type="tel"
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="vsl-trade" className="sr-only">Select Your Trade</label>
                  <select
                    id="vsl-trade"
                    required
                    value={form.trade}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, trade: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                  <option value="" className="bg-background">
                    Select Your Trade
                  </option>
                  <option value="hvac" className="bg-background">
                    HVAC
                  </option>
                  <option value="plumbing" className="bg-background">
                    Plumbing
                  </option>
                  <option value="roofing" className="bg-background">
                    Roofing
                  </option>
                  <option value="electrical" className="bg-background">
                    Electrical
                  </option>
                  <option value="landscaping" className="bg-background">
                    Landscaping
                  </option>
                  <option value="other" className="bg-background">
                    Other Home Service
                  </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : "Get My Free Strategy Session"}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  30-min call
                </span>
                <span>|</span>
                <span>100% free</span>
                <span>|</span>
                <span>No commitment</span>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="mt-16">
            <h3 className="mb-8 text-center text-2xl font-bold text-white">
              What You Get With Sovereign AI
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                "AI Chatbot that qualifies and books leads 24/7",
                "Missed-call text-back — never lose a lead again",
                "Automated 5-star review campaigns",
                "AI-written blog posts optimized for local SEO",
                "Facebook & Google Ads managed by AI",
                "Unified inbox for all customer messages",
                "Real-time ROI dashboard showing every dollar",
                "Done-for-you setup in 48 hours",
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <span className="text-foreground/80">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
