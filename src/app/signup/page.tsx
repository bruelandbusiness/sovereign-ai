"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VERTICALS } from "@/lib/constants";
import { Check, ArrowRight, Zap, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [vertical, setVertical] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

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
      <main className="flex-1 px-4 py-16">
        <Container>
          <div className="mx-auto max-w-lg">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                <Zap className="h-4 w-4" aria-hidden="true" />
                No credit card required
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Start Your 14-Day Free Trial
              </h1>
              <p className="mt-3 text-muted-foreground">
                Get instant access to AI-powered marketing tools. No commitment.
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
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 aria-[invalid=true]:border-red-500"
                      placeholder="John Smith"
                      required
                      autoComplete="name"
                      aria-invalid={error ? "true" : undefined}
                      aria-describedby={error ? "signup-error" : undefined}
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-foreground">Email Address</label>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 aria-[invalid=true]:border-red-500"
                      placeholder="john@yourbusiness.com"
                      required
                      autoComplete="email"
                      aria-invalid={error ? "true" : undefined}
                      aria-describedby={error ? "signup-error" : undefined}
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-business" className="mb-1 block text-sm font-medium text-foreground">Business Name</label>
                    <input
                      id="signup-business"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 aria-[invalid=true]:border-red-500"
                      placeholder="Smith's Plumbing"
                      required
                      autoComplete="organization"
                      aria-invalid={error ? "true" : undefined}
                      aria-describedby={error ? "signup-error" : undefined}
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-vertical" className="mb-1 block text-sm font-medium text-foreground">Industry</label>
                    <select
                      id="signup-vertical"
                      value={vertical}
                      onChange={(e) => setVertical(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select your industry</option>
                      {VERTICALS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Creating your account...
                      </>
                    ) : (
                      <>
                        Start Your 14-Day Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* What you get */}
            <div className="mt-8 space-y-3">
              <p className="text-center text-sm font-medium text-foreground">
                What&apos;s included in your free trial:
              </p>
              <ul className="grid gap-2 sm:grid-cols-3" aria-label="Free trial features">
                {[
                  { name: "AI Chatbot", detail: "50 chats/mo" },
                  { name: "CRM", detail: "50 leads" },
                  { name: "Analytics", detail: "Read-only" },
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
