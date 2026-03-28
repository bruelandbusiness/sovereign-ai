"use client";

import Link from "next/link";
import { Shield, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { Container } from "./Container";
import { cn } from "@/lib/utils";
import { trackNewsletterSignup } from "@/lib/tracking";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Free Audit", href: "/free-audit" },
      { label: "Services", href: "/services" },
      { label: "Pricing", href: "/pricing" },
      { label: "Live Demo", href: "/demo" },
      { label: "Case Studies", href: "/case-studies" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Guarantee", href: "/guarantee" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Knowledge Base", href: "/knowledge" },
      { label: "Free Masterclass", href: "/webinar" },
      { label: "AI Marketing Playbook", href: "/playbook" },
      { label: "Community", href: "/community" },
      { label: "Changelog", href: "/changelog" },
      { label: "System Status", href: "/status" },
      { label: "Get Started", href: "/onboarding" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Cookie Policy", href: "/legal/cookies" },
    ],
  },
];

const TRUST_BADGES = [
  "60-Day Money-Back Guarantee",
  "No Long-Term Contracts",
  "256-Bit Data Encryption",
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const emailError =
    emailTouched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Please enter a valid email address"
      : "";

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || emailError || isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Subscription failed. Please try again.");
        return;
      }

      trackNewsletterSignup("footer");
      setSubscribed(true);
      setEmail("");
      setEmailTouched(false);
      setTimeout(() => setSubscribed(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative border-t border-white/[0.06] bg-gradient-to-b from-[var(--bg-primary)] to-[#060609]">
      {/* Gradient accent */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(76,133,255,0.4), rgba(34,211,161,0.4), transparent)",
        }}
      />

      <Container className="pt-16 pb-8">
        {/* Newsletter section */}
        <motion.div
          className="mb-14 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                Stay ahead with{" "}
                <span className="gradient-text">Sovereign AI</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Weekly tips on AI marketing, lead generation, and growing your
                home service business.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="relative">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address for newsletter
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    required
                    autoComplete="email"
                    aria-invalid={!!(emailError || error)}
                    aria-describedby={
                      emailError
                        ? "footer-email-error"
                        : error
                          ? "footer-submit-error"
                          : undefined
                    }
                    className={cn(
                      "h-11 w-full rounded-lg border bg-white/[0.04] pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors sm:text-sm",
                      emailError ? "border-red-500/50" : "border-white/[0.08]"
                    )}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !!emailError}
                  aria-busy={isSubmitting}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                  {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
              {emailError && (
                <p id="footer-email-error" className="absolute -bottom-6 left-0 text-xs text-red-400">
                  {emailError}
                </p>
              )}
              {error && (
                <p id="footer-submit-error" role="alert" className="absolute -bottom-6 left-0 text-xs text-red-400">
                  {error}
                </p>
              )}
              {subscribed && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className="absolute -bottom-6 left-0 text-xs text-green-400"
                >
                  Subscribed successfully!
                </motion.p>
              )}
            </form>
          </div>
        </motion.div>

        {/* Main footer grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <SovereignLogo variant="wordmark" size="xs" />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              AI-powered marketing automation for local service businesses. 16
              AI systems working 24/7 to grow your revenue.
            </p>
            <div className="mt-5 space-y-2">
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Shield className="h-3.5 w-3.5 text-[#22d3a1]" aria-hidden="true" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={`${col.title} navigation`}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </p>
              <ul className="space-y-1">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:text-xs"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Sovereign AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/legal/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
