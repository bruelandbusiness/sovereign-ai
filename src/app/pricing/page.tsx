"use client";

import { useState, useEffect, useCallback } from "react";
import Balancer from "react-wrap-balancer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Shield,
  ArrowRight,
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Clock,
  Zap,
  ChevronDown,
  CalendarCheck,
  BadgeCheck,
  AlertCircle,
  Phone,
  Crown,
  Building2,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BUNDLES, SERVICES, VERTICALS, formatPrice } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { trackPricingPageView } from "@/lib/tracking";
import { trackBillingToggle, trackGetStartedClick } from "@/lib/analytics";

/* ---------------------------------------------------------------------------
 * Metadata (handled via Next.js head in layout — use generateMetadata for
 * server components; since this is "use client" we use JsonLd for SEO)
 * -------------------------------------------------------------------------*/

/* ---------------------------------------------------------------------------
 * Data
 * -------------------------------------------------------------------------*/

/** Map of bundle id -> set of included service ids for fast lookup */
const bundleServiceSets = Object.fromEntries(
  BUNDLES.map((b) => [b.id, new Set(b.services)])
);

/** Three tiers shown on this page (excluding DIY), reversed for price anchoring */
const TIERS = BUNDLES.filter((b) => b.id !== "diy").reverse();

const COST_PER_LEAD: Record<string, string> = {
  starter: "23",
  growth: "23",
  empire: "43",
};

/** Total value if each service were purchased individually */
const INDIVIDUAL_VALUE: Record<string, number> = {
  starter: 3794,
  growth: 9497,
  empire: 22488,
};

/** Benefit-driven CTA copy per plan */
const CTA_COPY: Record<string, string> = {
  starter: "Start Getting More Leads Today",
  growth: "Start Dominating My Market",
  empire: "Unlock All 16 AI Systems Now",
};

const ROI_MULTIPLIERS: Record<string, number> = {
  hvac: 3.8,
  plumbing: 4.2,
  roofing: 5.1,
  electrical: 3.5,
  landscaping: 3.0,
  "general-contractor": 4.0,
  other: 3.5,
};

const TESTIMONIALS_DATA = [
  {
    name: "Mike Richardson",
    business: "Richardson HVAC",
    location: "Dallas, TX",
    quote:
      "We went from 12 leads a month to over 60 in the first 90 days. The AI voice agent alone paid for the entire subscription by catching calls we used to miss.",
    rating: 5,
    result: "5x more leads in 90 days",
    avatar: "MR",
  },
  {
    name: "Sarah Chen",
    business: "PipePro Plumbing",
    location: "Phoenix, AZ",
    quote:
      "I was skeptical about AI handling our reputation, but our Google rating went from 3.8 to 4.7 stars in two months. The review management system is incredible.",
    rating: 5,
    result: "3.8 to 4.7 star rating",
    avatar: "SC",
  },
  {
    name: "James Okafor",
    business: "TopShield Roofing",
    location: "Atlanta, GA",
    quote:
      "The Growth plan is the best marketing investment we have ever made. Period. Our cost per lead dropped from $180 to under $25, and the quality is better.",
    rating: 5,
    result: "$180 to $25 cost per lead",
    avatar: "JO",
  },
];

const FAQ_DATA = [
  {
    q: "Is there a long-term contract?",
    a: "No. All plans are month-to-month. You can upgrade, downgrade, or cancel anytime from your dashboard. We earn your business every month.",
  },
  {
    q: "How quickly will I see results?",
    a: "Most clients see their first new leads within 48-72 hours of launch. Significant, measurable ROI typically materializes within the first 30 days. SEO results compound over 60-90 days.",
  },
  {
    q: "What if it doesn't work for my business?",
    a: "Every plan comes with a 60-day money-back guarantee. If you don't see measurable results, we'll refund your investment in full. No questions asked.",
  },
  {
    q: "Do I need to provide ad spend on top of the subscription?",
    a: "Only the AI Ad Management and AI Retargeting services require separate ad spend (paid directly to Google/Meta). All other services are fully included in your subscription price.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. You can upgrade or downgrade at any time. When you upgrade, the new services are deployed within 48 hours. Downgrades take effect at the next billing cycle.",
  },
  {
    q: "How is this different from hiring a marketing agency?",
    a: "Traditional agencies charge $5,000-$15,000/month, require 6-12 month contracts, and rely on manual processes. Sovereign AI delivers more services, faster results, and 24/7 execution at a fraction of the cost with no lock-in.",
  },
  {
    q: "What industries do you support?",
    a: "We specialize in home service businesses: HVAC, plumbing, roofing, electrical, landscaping, general contracting, and more. Our AI is specifically trained on these verticals for maximum performance.",
  },
  {
    q: "Do I get a dedicated account manager?",
    a: "Growth and Empire plan subscribers receive a dedicated success manager plus priority support. Starter plan users have access to our support team and self-serve dashboard.",
  },
];

/** Price validity date — one year from build/module-load time. */
const PRICE_VALID_UNTIL = new Date(
  Date.now() + 365 * 24 * 60 * 60 * 1000
).toISOString().split("T")[0];

/* ---------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------*/

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [annual, setAnnual] = useState(false);
  const [vertical, setVertical] = useState("hvac");
  const [leadsPerMonth, setLeadsPerMonth] = useState(20);
  const [avgJobValue, setAvgJobValue] = useState(2500);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [cancelBannerDismissed, setCancelBannerDismissed] = useState(false);

  const checkoutCanceled = searchParams.get("checkout") === "canceled";

  const dismissCancelBanner = useCallback(() => {
    setCancelBannerDismissed(true);
  }, []);

  useEffect(() => {
    trackPricingPageView();
  }, []);

  // ROI calculations
  const multiplier = ROI_MULTIPLIERS[vertical] || 3.5;
  const projectedLeads = Math.round(leadsPerMonth * multiplier);
  const closeRate = 0.3;
  const monthlyRevenue = Math.round(projectedLeads * closeRate * avgJobValue);
  const annualRevenue = monthlyRevenue * 12;
  const growthCost = annual ? 5831 : 6997;
  const roi = growthCost > 0 ? Math.round((monthlyRevenue / growthCost) * 10) / 10 : 0;
  const netProfit = monthlyRevenue - growthCost;
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      {/* Structured data */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Pricing - Sovereign AI",
          description:
            "Transparent pricing for AI-powered marketing automation. Plans starting at $497/mo with a 60-day money-back guarantee.",
          url: "https://www.trysovereignai.com/pricing",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Sovereign AI Marketing Platform",
          description:
            "AI-powered marketing automation for home service businesses. Done-for-you lead generation, SEO, reputation management, and 16 AI services.",
          brand: { "@type": "Brand", name: "Sovereign AI" },
          url: "https://www.trysovereignai.com/pricing",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            ratingCount: "500",
            bestRating: "5",
          },
          offers: TIERS.map((tier) => ({
            "@type": "Offer",
            name: `${tier.name} Plan`,
            price: String(tier.price),
            priceCurrency: "USD",
            description: `${tier.services.length} AI marketing services for home service businesses`,
            url: "https://www.trysovereignai.com/pricing",
            availability: "https://schema.org/InStock",
            priceValidUntil: PRICE_VALID_UNTIL,
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_DATA.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Pricing", url: "/pricing" },
        ]}
      />

      <Header />

      {/* Checkout canceled banner */}
      <AnimatePresence>
        {checkoutCanceled && !cancelBannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border-b border-amber-500/20 bg-amber-500/5"
          >
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-300">
                  Checkout was canceled. No worries — your selection is still
                  here. Ready when you are.
                </p>
              </div>
              <button
                onClick={dismissCancelBanner}
                className="shrink-0 rounded p-1 text-amber-400/60 transition-colors hover:text-amber-400"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" className="flex-1">
        {/* ----------------------------------------------------------------
         * HERO
         * ---------------------------------------------------------------*/}
        <Section className="relative overflow-hidden bg-dot-grid pt-28 sm:pt-32 lg:pt-36">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
          </div>

          <Container>
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm font-medium text-accent">
                  <Shield className="h-4 w-4" />
                  60-Day Money-Back Guarantee
                </div>

                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <Balancer>
                    <GradientText>Replace Your $10K/mo Agency</GradientText>
                    {" "}With 16 AI Systems That Never Sleep
                  </Balancer>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                  Traditional marketing agencies charge $5,000&ndash;$15,000/month with
                  12-month contracts. Sovereign AI delivers more services, faster
                  results, and 24/7 execution &mdash; starting at a fraction of
                  the cost. Every plan includes done-for-you setup and a 60-day
                  money-back guarantee.
                </p>

                {/* Comparison framing — what you'd pay elsewhere */}
                <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
                  <span>Marketing agency: <span className="font-semibold text-foreground line-through">$10K&ndash;$15K/mo</span></span>
                  <span>Full-time marketer: <span className="font-semibold text-foreground line-through">$6K&ndash;$8K/mo</span></span>
                  <span>Sovereign AI: <span className="font-bold text-accent">from $3,497/mo</span></span>
                </div>

                {/* Annual / Monthly toggle */}
                <div className="mt-8 flex flex-col items-center gap-3">
                  <div className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card p-1">
                    <button
                      onClick={() => {
                        setAnnual(false);
                        trackBillingToggle("monthly");
                      }}
                      className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                        !annual
                          ? "gradient-bg text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => {
                        setAnnual(true);
                        trackBillingToggle("annual");
                      }}
                      className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                        annual
                          ? "gradient-bg text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Annual
                      <span className="ml-1.5 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                        Save 20%
                      </span>
                    </button>
                  </div>
                  <AnimatePresence>
                    {!annual && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-xs text-accent font-medium"
                      >
                        Switch to annual and save up to $25,992/yr
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mx-auto mt-6 max-w-sm">
                  <CountdownTimer
                    label="Free onboarding bonus ends in:"
                    hoursFromVisit={72}
                    variant="banner"
                  />
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * PRICING CARDS
         * ---------------------------------------------------------------*/}
        <Section className="pt-4 sm:pt-6 lg:pt-8">
          <Container>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-6 lg:grid-cols-3"
            >
              {TIERS.map((bundle) => {
                const resolvedServices = bundle.services
                  .map((id) => SERVICES.find((s) => s.id === id))
                  .filter(Boolean);
                const costPerLead = COST_PER_LEAD[bundle.id];
                const individualValue = INDIVIDUAL_VALUE[bundle.id];
                const currentPrice = annual ? bundle.annualPrice : bundle.price;
                const dailyPrice = Math.round(currentPrice / 30);
                const annualSavings = (bundle.price - bundle.annualPrice) * 12;

                return (
                  <motion.div
                    key={bundle.id}
                    variants={staggerItem}
                    className="flex"
                  >
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "relative flex h-full w-full",
                        bundle.popular && "z-10 lg:scale-105"
                      )}
                    >
                      {bundle.popular && (
                        <div className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1">
                          <motion.span
                            initial={{ scale: 0.9 }}
                            animate={{ scale: [0.9, 1.05, 1] }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex items-center gap-1.5 rounded-full gradient-bg px-5 py-1.5 text-xs font-bold text-white shadow-lg shadow-primary/25"
                          >
                            <Crown className="h-3.5 w-3.5" />
                            Best Value &mdash; Most Popular
                          </motion.span>
                        </div>
                      )}

                      <Card
                        className={cn(
                          "flex h-full w-full flex-col border glass-card",
                          bundle.popular
                            ? "border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20 glow-pulse"
                            : "border-border/50 card-hover-lift"
                        )}
                      >
                        <CardHeader
                          className={cn(
                            "text-center",
                            bundle.popular && "pt-10"
                          )}
                        >
                          <h3 className="font-display text-2xl font-bold">
                            {bundle.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {bundle.description}
                          </p>

                          {/* Value stacking — show total value before price */}
                          {individualValue && (
                            <p className="mt-4 text-xs text-muted-foreground">
                              <span className="line-through">{formatPrice(individualValue)}/mo value</span>
                            </p>
                          )}

                          <div className="mt-2 flex flex-col items-center">
                            <PriceDisplay
                              amount={currentPrice}
                              size="lg"
                            />
                            {/* Daily price framing */}
                            <span className="mt-0.5 text-xs font-medium text-accent">
                              Just ${dailyPrice}/day
                            </span>
                            {annual && (
                              <span className="mt-1 text-xs text-muted-foreground line-through">
                                ${bundle.price.toLocaleString()}/mo
                              </span>
                            )}
                            {bundle.savings && (
                              <span className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
                                {annual
                                  ? `Save ${formatPrice(annualSavings)}/yr`
                                  : bundle.savings}
                              </span>
                            )}
                            {bundle.popular && (
                              <span className="mt-2 text-xs text-muted-foreground">
                                94% of clients choose this plan
                              </span>
                            )}
                            {costPerLead && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                ~${costPerLead}/lead vs $150+ on Google Ads
                              </p>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col justify-between gap-6">
                          <ul className="space-y-2.5">
                            {resolvedServices.map((service) =>
                              service ? (
                                <li
                                  key={service.id}
                                  className="flex items-center gap-2.5 text-sm"
                                >
                                  <Check className="h-4 w-4 shrink-0 text-accent" />
                                  <span className="text-foreground">
                                    {service.name}
                                  </span>
                                </li>
                              ) : null
                            )}
                          </ul>

                          <div className="flex flex-col gap-3">
                            <Link
                              href={`/onboarding?bundle=${bundle.id}`}
                            >
                              <GradientButton
                                variant={
                                  bundle.popular ? "gradient" : "outline"
                                }
                                size="lg"
                                className={cn(
                                  "w-full",
                                  bundle.popular && "btn-shine"
                                )}
                                onClick={() => {
                                  trackGetStartedClick(
                                    bundle.id,
                                    annual ? "annual" : "monthly",
                                  );
                                }}
                              >
                                {CTA_COPY[bundle.id] || "Start My 14-Day Trial"}
                                <ArrowRight className="h-4 w-4" />
                              </GradientButton>
                            </Link>
                            <p className="text-center text-xs text-muted-foreground">
                              Includes free onboarding ($2,500 value) &middot; No contracts
                            </p>
                            <div className="flex items-center justify-center gap-1.5 text-center text-xs">
                              <Shield className="h-3 w-3 text-accent" />
                              <span className="font-medium text-accent">
                                60-day money-back guarantee
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>

            <FadeInView delay={0.3}>
              <p className="mt-10 text-center text-base text-muted-foreground">
                Looking for a lighter plan?{" "}
                <Link
                  href="/onboarding?bundle=diy"
                  className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                >
                  DIY plan starts at $497/mo
                </Link>{" "}
                with 3 core AI tools.
              </p>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * TRUST SIGNALS BAR
         * ---------------------------------------------------------------*/}
        <Section className="py-10 sm:py-12">
          <Container>
            <FadeInView>
              <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
                {[
                  {
                    icon: Shield,
                    title: "60-Day Guarantee",
                    desc: "Full refund if you don't see results",
                  },
                  {
                    icon: CalendarCheck,
                    title: "No Long-Term Contracts",
                    desc: "Month-to-month. Cancel anytime.",
                  },
                  {
                    icon: Zap,
                    title: "48-Hour Deployment",
                    desc: "Live and generating leads in 2 days",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 px-5 py-4 trust-card-hover"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * SOCIAL PROOF STRIP
         * ---------------------------------------------------------------*/}
        <Section className="py-8 sm:py-10 border-y border-border/30">
          <Container>
            <FadeInView>
              <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
                {/* Avatar cluster */}
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {["MR", "SC", "JO", "DL", "KP"].map((initials, i) => (
                      <div
                        key={initials}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-bold text-primary"
                        style={{ zIndex: 5 - i }}
                      >
                        {initials}
                      </div>
                    ))}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-accent/10 text-[10px] font-bold text-accent">
                      +495
                    </div>
                  </div>
                </div>

                {/* Copy */}
                <div className="text-center sm:text-left">
                  <p className="text-sm font-semibold text-foreground">
                    Trusted by 500+ home service businesses
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-1 sm:justify-start">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                    <span className="ml-1 text-xs text-muted-foreground">
                      4.9/5 average rating
                    </span>
                  </div>
                </div>

                {/* Industry logos placeholder */}
                <div className="flex items-center gap-4 text-muted-foreground/40">
                  {["HVAC Pros", "PlumbCo", "RoofRight", "ElectraPro"].map(
                    (name) => (
                      <span
                        key={name}
                        className="text-[11px] font-bold uppercase tracking-wider"
                      >
                        {name}
                      </span>
                    )
                  )}
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * FEATURE COMPARISON TABLE
         * ---------------------------------------------------------------*/}
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Compare <GradientText>All 16 Services</GradientText> Across
                  Plans
                </h2>
                <p className="mt-4 text-muted-foreground">
                  See exactly what you get with each plan. Every checkmark is a
                  fully managed, done-for-you AI service.
                </p>
              </div>
            </FadeInView>

            <FadeInView delay={0.1}>
              {/* Scroll hint for mobile */}
              <p className="mb-2 text-center text-xs text-muted-foreground sm:hidden">
                Swipe to compare all plans &rarr;
              </p>
              <div className="mx-auto mt-10 max-w-5xl -mx-4 px-4 sm:mx-auto sm:px-0 overflow-x-auto rounded-xl border border-border/50 glass-card" role="region" aria-label="Feature comparison table" tabIndex={0}>
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-4 py-4 text-left font-medium text-muted-foreground sm:px-6">
                        Service
                      </th>
                      {TIERS.map((tier) => (
                        <th
                          key={tier.id}
                          className={cn(
                            "px-4 py-4 text-center font-semibold sm:px-6",
                            tier.popular && "text-primary bg-primary/[0.03]"
                          )}
                        >
                          {tier.name}
                          <span className="block text-xs font-normal text-muted-foreground">
                            {formatPrice(annual ? tier.annualPrice : tier.price)}
                            /mo
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SERVICES.map((service, idx) => (
                      <tr
                        key={service.id}
                        className={cn(
                          "border-b border-border/30 transition-colors hover:bg-card/60",
                          idx % 2 === 0 && "bg-card/20"
                        )}
                      >
                        <td className="px-4 py-3 font-medium sm:px-6">
                          {service.name}
                        </td>
                        {TIERS.map((tier) => {
                          const included = bundleServiceSets[tier.id]?.has(
                            service.id
                          );
                          return (
                            <td
                              key={tier.id}
                              className={cn(
                                "px-4 py-3 text-center sm:px-6",
                                tier.popular && "bg-primary/[0.03]"
                              )}
                            >
                              {included ? (
                                <Check className="mx-auto h-5 w-5 text-accent" />
                              ) : (
                                <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border/50">
                      <td className="px-4 py-4 font-semibold sm:px-6">
                        Total Services
                      </td>
                      {TIERS.map((tier) => (
                        <td
                          key={tier.id}
                          className={cn(
                            "px-4 py-4 text-center font-bold text-lg",
                            tier.popular ? "text-primary" : "text-foreground"
                          )}
                        >
                          {tier.services.length}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * MONEY-BACK GUARANTEE BADGE
         * ---------------------------------------------------------------*/}
        <Section className="py-10 sm:py-14">
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <ShieldCheck className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-display text-2xl font-bold">
                  60-Day Money-Back Guarantee
                </h3>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Try any plan risk-free. If you don&apos;t see measurable results
                  in 60 days, we&apos;ll refund your investment in full &mdash;
                  no questions asked. We&apos;re that confident Sovereign AI will
                  transform your business.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    Full refund
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    No questions asked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    Cancel anytime
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    Keep all generated content
                  </span>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * ROI CALCULATOR
         * ---------------------------------------------------------------*/}
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                  <Calculator className="h-4 w-4" />
                  ROI Calculator
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  See Your <GradientText>Growth Potential</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Drag the slider to see how Sovereign AI multiplies your leads
                  and revenue.
                </p>
              </div>
            </FadeInView>

            <FadeInView delay={0.1}>
              <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-border/50 glass-card p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Inputs */}
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Your Industry
                      </label>
                      <select
                        value={vertical}
                        onChange={(e) => setVertical(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm min-h-[44px]"
                      >
                        {VERTICALS.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Current Leads Per Month:{" "}
                        <span className="text-primary font-bold">
                          {leadsPerMonth}
                        </span>
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={200}
                        step={5}
                        value={leadsPerMonth}
                        onChange={(e) =>
                          setLeadsPerMonth(Number(e.target.value))
                        }
                        className="w-full accent-primary"
                      />
                      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                        <span>5</span>
                        <span>100</span>
                        <span>200</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Average Job Value ($)
                      </label>
                      <input
                        type="number"
                        value={avgJobValue}
                        onChange={(e) =>
                          setAvgJobValue(Number(e.target.value) || 0)
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base sm:text-sm min-h-[44px]"
                        min={0}
                        step={100}
                      />
                    </div>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-xs text-muted-foreground">
                        Based on a{" "}
                        <span className="font-semibold text-primary">
                          {multiplier}x
                        </span>{" "}
                        lead multiplier for{" "}
                        {VERTICALS.find((v) => v.id === vertical)?.label ||
                          vertical}{" "}
                        businesses with a 30% close rate. Investment based on the
                        Growth plan ({formatPrice(growthCost)}/mo).
                      </p>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="space-y-4">
                    <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Projected Results with Sovereign AI
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border/50 bg-primary/5 p-4 text-center">
                        <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
                        <p className="text-2xl font-bold text-primary">
                          {projectedLeads}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Leads/Month
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-accent/5 p-4 text-center">
                        <DollarSign className="mx-auto mb-1 h-5 w-5 text-accent" />
                        <p className="text-2xl font-bold text-accent">
                          {formatPrice(monthlyRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Monthly Revenue
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
                        <DollarSign className="mx-auto mb-1 h-5 w-5 text-foreground" />
                        <p className="text-2xl font-bold">
                          {formatPrice(annualRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Annual Revenue
                        </p>
                      </div>
                      <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
                        <TrendingUp className="mx-auto mb-1 h-5 w-5 text-primary" />
                        <p className="text-2xl font-bold text-primary">
                          {roi}x
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Monthly ROI
                        </p>
                      </div>
                    </div>

                    {netProfit > 0 && (
                      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Estimated Monthly Net Profit
                        </p>
                        <p className="text-3xl font-bold text-accent">
                          {formatPrice(netProfit)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          After your Sovereign AI investment
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-tier ROI comparison */}
                <div className="mt-8 border-t border-border/50 pt-6">
                  <h4 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Projected ROI by Plan
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {TIERS.map((tier) => {
                      const tierPrice = annual
                        ? tier.annualPrice
                        : tier.price;
                      const tierMultiplier =
                        tier.id === "starter"
                          ? multiplier * 0.6
                          : tier.id === "empire"
                            ? multiplier * 1.4
                            : multiplier;
                      const tierLeads = Math.round(
                        leadsPerMonth * tierMultiplier
                      );
                      const tierRevenue = Math.round(
                        tierLeads * closeRate * avgJobValue
                      );
                      const tierRoi =
                        tierPrice > 0
                          ? Math.round((tierRevenue / tierPrice) * 10) / 10
                          : 0;
                      const tierProfit = tierRevenue - tierPrice;

                      return (
                        <div
                          key={tier.id}
                          className={cn(
                            "rounded-xl border p-4 text-center",
                            tier.popular
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/50 bg-card/50"
                          )}
                        >
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              tier.popular && "text-primary"
                            )}
                          >
                            {tier.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(tierPrice)}/mo
                          </p>
                          <p
                            className={cn(
                              "mt-2 text-xl font-bold",
                              tier.popular
                                ? "text-primary"
                                : "text-foreground"
                            )}
                          >
                            {tierRoi}x ROI
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(tierProfit)}/mo profit
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * TESTIMONIALS
         * ---------------------------------------------------------------*/}
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Don&apos;t Take Our Word for It &mdash;{" "}
                  <GradientText>Hear From Contractors Like You</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  These business owners were skeptical too. Here&apos;s what happened
                  after they gave Sovereign AI 30 days.
                </p>
              </div>
            </FadeInView>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3"
            >
              {TESTIMONIALS_DATA.map((t) => (
                <motion.div key={t.name} variants={staggerItem}>
                  <div className="flex h-full flex-col rounded-xl border border-border/50 glass-card testimonial-card-hover p-6">
                    {/* Stars */}
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>

                    {/* Result badge */}
                    {t.result && (
                      <div className="mt-4 inline-flex self-start rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        {t.result}
                      </div>
                    )}

                    {/* Author */}
                    <div className="mt-4 flex items-center gap-3 border-t border-border/30 pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.business} &middot; {t.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * FAQ
         * ---------------------------------------------------------------*/}
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Frequently Asked <GradientText>Questions</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Everything you need to know before getting started.
                </p>
              </div>
            </FadeInView>

            <FadeInView delay={0.1}>
              <div className="mx-auto mt-10 max-w-3xl divide-y divide-border/50 rounded-xl border border-border/50 glass-card">
                {FAQ_DATA.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-5 sm:px-6 text-left transition-colors hover:bg-card/60 min-h-[48px]"
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm font-medium sm:text-base">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                      <motion.div
                        initial={false}
                        animate={{
                          height: isOpen ? "auto" : 0,
                          opacity: isOpen ? 1 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-5 sm:px-6 text-sm leading-relaxed text-muted-foreground">
                          {faq.a}
                        </p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * ENTERPRISE / CUSTOM PLAN
         * ---------------------------------------------------------------*/}
        <Section className="py-12 sm:py-16">
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-4xl rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 sm:p-12">
                <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                      <Building2 className="h-4 w-4" />
                      Enterprise
                    </div>
                    <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                      Need a <GradientText>Custom Plan</GradientText>?
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                      Multi-location businesses, franchises, and large operations
                      need tailored solutions. Get a custom quote with dedicated
                      infrastructure, white-glove onboarding, and SLA guarantees.
                    </p>
                    <ul className="mt-6 space-y-3">
                      {[
                        "Custom AI model training on your brand voice",
                        "Multi-location dashboard and reporting",
                        "Dedicated account manager and priority support",
                        "Custom API integrations with your existing tools",
                        "Volume pricing for multiple service areas",
                      ].map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2.5 text-sm"
                        >
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col items-center text-center lg:items-end lg:text-right">
                    <div className="w-full max-w-sm rounded-xl border border-border/50 bg-card/80 p-6">
                      <MessageSquare className="mx-auto mb-3 h-8 w-8 text-primary" />
                      <h3 className="text-lg font-bold">
                        Talk to Our Enterprise Team
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Get a custom quote in 24 hours. No commitment required.
                      </p>
                      <Link href="/strategy-call" className="mt-4 block">
                        <GradientButton
                          size="lg"
                          className="w-full"
                        >
                          <Phone className="h-4 w-4" />
                          Book a Strategy Call
                        </GradientButton>
                      </Link>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Or email us at{" "}
                        <a
                          href="mailto:enterprise@trysovereignai.com"
                          className="font-medium text-primary hover:underline"
                        >
                          enterprise@trysovereignai.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ----------------------------------------------------------------
         * BOTTOM CTA
         * ---------------------------------------------------------------*/}
        <Section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
          </div>

          <Container>
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-sm font-medium text-accent">
                  <BadgeCheck className="h-4 w-4" />
                  Risk-Free Guarantee
                </div>

                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Your Competitors Won&apos;t Wait.{" "}
                  <GradientText>Neither Should You.</GradientText>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                  Every week you delay, competitors with AI marketing are capturing
                  the leads you should be getting. Join 500+ contractors who made
                  the switch &mdash; your 48-hour setup starts today.
                </p>

                <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-center">
                  <Link href="/onboarding?bundle=growth" className="w-full sm:w-auto">
                    <GradientButton size="lg" className="btn-shine text-base w-full sm:w-auto">
                      Lock In My Growth Plan Now
                      <ArrowRight className="h-4 w-4" />
                    </GradientButton>
                  </Link>
                  <Link href="/strategy-call" className="w-full sm:w-auto">
                    <GradientButton
                      variant="outline"
                      size="lg"
                      className="text-base w-full sm:w-auto"
                    >
                      Talk to a Strategist First
                    </GradientButton>
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-accent" />
                    60-day money-back guarantee
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    48-hour deployment
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5 text-accent" />
                    No long-term contracts
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <Link href="/services" className="hover:text-foreground transition-colors">
                    All Services
                  </Link>
                  <span className="text-border">|</span>
                  <Link href="/free-audit" className="hover:text-foreground transition-colors">
                    Free AI Audit
                  </Link>
                  <span className="text-border">|</span>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About Us
                  </Link>
                  <span className="text-border">|</span>
                  <Link href="/demo" className="hover:text-foreground transition-colors">
                    Live Demo
                  </Link>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
