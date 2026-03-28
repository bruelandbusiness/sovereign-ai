"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { VERTICALS } from "@/lib/constants";
import { Check, ArrowRight, Zap, Loader2, Shield } from "lucide-react";
import { GradientButton } from "@/components/shared/GradientButton";
import { trackFormSubmission, trackFormCompletion } from "@/lib/analytics";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [vertical, setVertical] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const fieldErrors = {
    name: touched.name && name.length === 0 ? "Name is required" : "",
    email:
      touched.email && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Please enter a valid email address"
        : touched.email && email.length === 0
          ? "Email is required"
          : "",
    businessName:
      touched.businessName && businessName.length === 0
        ? "Business name is required"
        : "",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    trackFormSubmission("signup");

    try {
      const res = await fetch("/api/auth/signup-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, businessName, vertical }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "We couldn't create your account. Please check your details and try again.");
        nameRef.current?.focus();
        return;
      }

      trackFormCompletion("signup");
      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      nameRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <Container>
            <Card className="mx-auto max-w-md">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10" aria-hidden="true">
                  <Check className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-xl font-bold">Check Your Email!</h2>
                <p className="mt-2 text-sm text-muted-foreground" role="status" aria-live="polite">
                  We sent a magic link to <strong>{email}</strong>. Click it to access your
                  dashboard and start your 14-day free trial.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  No credit card required. Cancel anytime.
                </p>
              </CardContent>
            </Card>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 px-4 py-16">
        <Container>
          <div className="mx-auto max-w-lg">
            {/* Progress indicator */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</div>
                <span className="text-xs font-medium text-foreground">Create Account</span>
              </div>
              <div className="h-px w-8 bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">2</div>
                <span className="text-xs text-muted-foreground">Customize AI</span>
              </div>
              <div className="h-px w-8 bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">3</div>
                <span className="text-xs text-muted-foreground">Go Live</span>
              </div>
            </div>

            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" aria-hidden="true" />
                No credit card required &mdash; Takes 30 seconds
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Start Getting More Leads in 48 Hours
              </h1>
              <p className="mt-3 text-muted-foreground">
                Join 500+ contractors already growing with AI-powered marketing.
                14-day free trial, no commitment, cancel anytime.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div aria-live="polite" aria-atomic="true">
                    {error && (
                      <div id="signup-error" role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-foreground">Your Name</label>
                    <input
                      ref={nameRef}
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => markTouched("name")}
                      className={`mt-1 input-sovereign ${fieldErrors.name ? "input-error" : ""}`}
                      placeholder="John Smith"
                      required
                      autoComplete="name"
                      aria-invalid={!!(fieldErrors.name || error)}
                      aria-describedby={
                        fieldErrors.name
                          ? "signup-name-error"
                          : error
                            ? "signup-error"
                            : undefined
                      }
                    />
                    {fieldErrors.name && (
                      <p id="signup-name-error" className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-foreground">Email Address</label>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched("email")}
                      className={`mt-1 input-sovereign ${fieldErrors.email ? "input-error" : ""}`}
                      placeholder="john@yourbusiness.com"
                      required
                      autoComplete="email"
                      aria-invalid={!!(fieldErrors.email || error)}
                      aria-describedby={
                        fieldErrors.email
                          ? "signup-email-error"
                          : error
                            ? "signup-error"
                            : undefined
                      }
                    />
                    {fieldErrors.email && (
                      <p id="signup-email-error" className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-business" className="mb-1 block text-sm font-medium text-foreground">Business Name</label>
                    <input
                      id="signup-business"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onBlur={() => markTouched("businessName")}
                      className={`mt-1 input-sovereign ${fieldErrors.businessName ? "input-error" : ""}`}
                      placeholder="Smith's Plumbing"
                      required
                      autoComplete="organization"
                      aria-invalid={!!(fieldErrors.businessName || error)}
                      aria-describedby={
                        fieldErrors.businessName
                          ? "signup-business-error"
                          : error
                            ? "signup-error"
                            : undefined
                      }
                    />
                    {fieldErrors.businessName && (
                      <p id="signup-business-error" className="mt-1 text-xs text-red-400">{fieldErrors.businessName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-vertical" className="mb-1 block text-sm font-medium text-foreground">Industry</label>
                    <select
                      id="signup-vertical"
                      value={vertical}
                      onChange={(e) => setVertical(e.target.value)}
                      required
                      className="mt-1 input-sovereign"
                    >
                      <option value="">Select your industry</option>
                      {VERTICALS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <GradientButton
                    type="submit"
                    size="lg"
                    className="w-full btn-shine cta-glow min-h-[48px] text-base"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Setting up your AI systems...
                      </>
                    ) : (
                      <>
                        Start Growing My Business Today
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </GradientButton>

                  {/* Trust signals near conversion point */}
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-accent" aria-hidden="true" />
                      60-day money-back guarantee
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-accent" aria-hidden="true" />
                      No credit card required
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-accent" aria-hidden="true" />
                      Cancel anytime
                    </span>
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Social proof testimonial */}
            <div className="mt-6 rounded-lg border border-border/30 bg-card/40 p-4 text-center">
              <div className="mb-2 flex justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-amber-400 text-sm">&#9733;</span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                &ldquo;Signed up on Monday, had leads coming in by Wednesday. Best marketing decision I&apos;ve made in 15 years.&rdquo;
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">&mdash; James O., roofing contractor, Atlanta</p>
            </div>

            {/* What you get */}
            <div className="mt-6 space-y-3">
              <p className="text-center text-sm font-medium text-foreground">
                Included free in your trial &mdash; no strings attached:
              </p>
              <ul className="grid gap-2 sm:grid-cols-3" aria-label="Free trial features">
                {[
                  { name: "AI Chatbot", detail: "Captures leads 24/7" },
                  { name: "Smart CRM", detail: "Never lose a lead" },
                  { name: "Live Analytics", detail: "Track every dollar" },
                ].map((feature) => (
                  <li
                    key={feature.name}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2"
                  >
                    <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{feature.name}</p>
                      <p className="text-xs text-muted-foreground">{feature.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
