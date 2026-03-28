"use client";

import { useState } from "react";
import Balancer from "react-wrap-balancer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Rocket,
  Settings,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { IconBadge } from "@/components/shared/IconBadge";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { getServiceIcon } from "@/lib/service-icons";
import { SERVICES, BUNDLES, SERVICE_CATEGORIES } from "@/lib/constants";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { trackServiceInteraction } from "@/lib/tracking";
import type { Service } from "@/types/services";

/* ------------------------------------------------------------------ */
/*  Metadata helper — Since this is a "use client" page we set        */
/*  document.title via useEffect-free approach; for full SSR metadata  */
/*  move the export to a separate layout.tsx or a generateMetadata fn. */
/* ------------------------------------------------------------------ */

// For SEO: add a head tag via Next.js metadata convention in layout or
// via next/head if needed. The page title is set in the <title> below.

/* ------------------------------------------------------------------ */
/*  Helper: determine which bundle tier includes a service             */
/* ------------------------------------------------------------------ */
function getLowestBundle(serviceId: string): string {
  for (const bundle of BUNDLES) {
    if (bundle.services.includes(serviceId as never)) {
      return bundle.name;
    }
  }
  return "Empire";
}

/* ------------------------------------------------------------------ */
/*  Category color map for subtle card accent                         */
/* ------------------------------------------------------------------ */
const categoryColors: Record<string, string> = {
  generation: "text-blue-400",
  engagement: "text-purple-400",
  management: "text-amber-400",
  intelligence: "text-emerald-400",
};

const categoryLabels: Record<string, string> = {
  generation: "Lead Generation",
  engagement: "Engagement",
  management: "Management",
  intelligence: "Intelligence",
};

/* ------------------------------------------------------------------ */
/*  Before / After data                                               */
/* ------------------------------------------------------------------ */
const comparisonRows = [
  {
    label: "Lead generation",
    without: "Referrals & word of mouth only",
    with: "AI finds leads 24/7 across 5+ channels",
  },
  {
    label: "Missed calls",
    without: "30-40% of calls go to voicemail",
    with: "AI answers every call in < 2 seconds",
  },
  {
    label: "Follow-up",
    without: "Manual, inconsistent, often forgotten",
    with: "Automated multi-touch sequences",
  },
  {
    label: "Online reviews",
    without: "Hope customers leave them",
    with: "Automated requests + AI responses",
  },
  {
    label: "SEO & content",
    without: "Outdated website, no blog",
    with: "8 SEO articles/month + local dominance",
  },
  {
    label: "Data & insights",
    without: "Gut feelings, no tracking",
    with: "Real-time AI analytics dashboard",
  },
  {
    label: "Cost",
    without: "$8-15K/mo for a marketing team",
    with: "Starting at $497/mo, all-in",
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */
export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [, setBookingOpen] = useState(false);

  const filteredServices =
    activeCategory === "all"
      ? SERVICES
      : SERVICES.filter((s) => s.category === activeCategory);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Services", url: "/services" },
        ]}
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "AI Marketing Automation",
          provider: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
          },
          areaServed: {
            "@type": "Country",
            name: "United States",
          },
          description:
            "16 AI-powered marketing services for home service businesses including lead generation, reputation management, SEO, content creation, and more.",
          offers: {
            "@type": "AggregateOffer",
            lowPrice: "497",
            highPrice: "12997",
            priceCurrency: "USD",
          },
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "AI Marketing Services",
            itemListElement: SERVICES.slice(0, 6).map((s) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: s.name,
                description: s.description,
              },
            })),
          },
        }}
      />

      <div className="flex min-h-screen flex-col bg-background page-enter">
        <Header onCtaClick={() => setBookingOpen(true)} />

        <main id="main-content" className="flex-1">
          {/* ============================================================ */}
          {/*  HERO                                                        */}
          {/* ============================================================ */}
          <section className="relative min-h-[50vh] overflow-hidden">
            <GradientOrb position="top-right" size="lg" color="primary" />
            <GradientOrb position="bottom-left" size="lg" color="accent" />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(76,133,255,0.08) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 py-20 sm:py-28 lg:py-36">
              <Container className="relative z-10">
                <div className="mx-auto max-w-4xl text-center">
                  <FadeInView>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-sm text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                      All services include 60-day money-back guarantee
                    </div>
                  </FadeInView>

                  <FadeInView delay={0.1}>
                    <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                      <Balancer>
                        <GradientText>16 AI Systems</GradientText> Working{" "}
                        24/7 For Your Business
                      </Balancer>
                    </h1>
                  </FadeInView>

                  <FadeInView delay={0.2}>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                      Every service a home service business needs to generate
                      leads, close deals, and dominate their local market
                      &mdash; powered by AI that never sleeps.
                    </p>
                  </FadeInView>

                  <FadeInView delay={0.25}>
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:mt-10 sm:flex-row">
                      <Link href="/free-audit">
                        <GradientButton
                          size="lg"
                          className="btn-shine px-10 py-3 text-base"
                        >
                          Get Your Free AI Audit
                          <ArrowRight className="h-4 w-4" />
                        </GradientButton>
                      </Link>
                      <Link href="/pricing">
                        <GradientButton
                          variant="outline"
                          size="lg"
                          className="gap-2"
                        >
                          View Pricing & Bundles
                          <ArrowRight className="h-4 w-4" />
                        </GradientButton>
                      </Link>
                    </div>
                  </FadeInView>

                  {/* Stats row */}
                  <FadeInView delay={0.3}>
                    <div className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-x-10 gap-y-4">
                      <div className="text-center">
                        <p className="font-display text-3xl font-bold gradient-text">
                          16
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          AI Services
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-3xl font-bold gradient-text">
                          4
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Bundle Tiers
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-3xl font-bold gradient-text">
                          48hr
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Deployment
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-display text-3xl font-bold gradient-text">
                          24/7
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Always Running
                        </p>
                      </div>
                    </div>
                  </FadeInView>
                </div>
              </Container>
            </div>
          </section>

          {/* ============================================================ */}
          {/*  SERVICE GRID                                                */}
          {/* ============================================================ */}
          <Section id="all-services">
            <Container>
              <FadeInView>
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    Everything You Need to{" "}
                    <GradientText>Dominate Your Market</GradientText>
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Each service is purpose-built for home service businesses.
                    Mix and match, or grab a bundle and save.
                  </p>
                </div>
              </FadeInView>

              {/* Category filters */}
              <FadeInView delay={0.1}>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  {SERVICE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        trackServiceInteraction(cat.id);
                      }}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                        activeCategory === cat.id
                          ? "gradient-bg text-white"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </FadeInView>

              {/* Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {filteredServices.map((service) => (
                    <motion.div key={service.id} variants={staggerItem}>
                      <ServiceDetailCard service={service} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </Container>
          </Section>

          {/* ============================================================ */}
          {/*  HOW IT WORKS                                                */}
          {/* ============================================================ */}
          <Section className="relative overflow-hidden border-t border-border/40">
            <GradientOrb position="top-right" size="md" color="accent" />
            <Container>
              <FadeInView>
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    <GradientText>3 Steps</GradientText> to AI-Powered Growth
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    We handle the tech. You handle the jobs.
                  </p>
                </div>
              </FadeInView>

              <div className="relative mt-16">
                {/* Connector line (desktop) */}
                <div className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" />

                <div className="grid gap-8 sm:gap-12 lg:grid-cols-3">
                  {/* Step 1 */}
                  <FadeInView delay={0.1}>
                    <div className="group relative text-center">
                      <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10">
                        <Rocket className="h-7 w-7 text-primary" />
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Step 1
                      </div>
                      <h3 className="mt-4 font-display text-xl font-bold">
                        Sign Up & Strategize
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Book a 15-minute strategy call. We learn your goals,
                        analyze your market, and recommend the perfect AI stack
                        for your business.
                      </p>
                    </div>
                  </FadeInView>

                  {/* Step 2 */}
                  <FadeInView delay={0.2}>
                    <div className="group relative text-center">
                      <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10">
                        <Settings className="h-7 w-7 text-primary" />
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Step 2
                      </div>
                      <h3 className="mt-4 font-display text-xl font-bold">
                        We Deploy in 48 Hours
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Our team configures, tests, and launches your AI
                        systems. You get a live dashboard and start seeing
                        results within two days.
                      </p>
                    </div>
                  </FadeInView>

                  {/* Step 3 */}
                  <FadeInView delay={0.3}>
                    <div className="group relative text-center">
                      <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10">
                        <TrendingUp className="h-7 w-7 text-primary" />
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Step 3
                      </div>
                      <h3 className="mt-4 font-display text-xl font-bold">
                        You Grow on Autopilot
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        Your AI systems generate leads, answer calls, book jobs,
                        and build your brand around the clock. Scale what works,
                        add services as you grow.
                      </p>
                    </div>
                  </FadeInView>
                </div>
              </div>
            </Container>
          </Section>

          {/* ============================================================ */}
          {/*  BEFORE / AFTER                                              */}
          {/* ============================================================ */}
          <Section className="border-t border-border/40">
            <Container>
              <FadeInView>
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    Life <span className="text-muted-foreground">Without</span>{" "}
                    vs. <GradientText>With</GradientText> Sovereign AI
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    See the difference AI automation makes for your business.
                  </p>
                </div>
              </FadeInView>

              <FadeInView delay={0.15}>
                <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-xl border border-border/50">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border/50 bg-card/60 text-sm font-semibold">
                    <div className="px-4 py-3 sm:px-6" />
                    <div className="flex items-center gap-2 border-l border-border/30 px-4 py-3 text-red-400 sm:px-6">
                      <X className="h-4 w-4" />
                      Without AI
                    </div>
                    <div className="flex items-center gap-2 border-l border-border/30 px-4 py-3 text-green-400 sm:px-6">
                      <Check className="h-4 w-4" />
                      With Sovereign AI
                    </div>
                  </div>

                  {/* Rows */}
                  {comparisonRows.map((row, i) => (
                    <div
                      key={row.label}
                      className={cn(
                        "grid grid-cols-[1fr_1fr_1fr] text-sm",
                        i < comparisonRows.length - 1 &&
                          "border-b border-border/30"
                      )}
                    >
                      <div className="flex items-center px-4 py-3.5 font-medium sm:px-6">
                        {row.label}
                      </div>
                      <div className="flex items-center border-l border-border/30 px-4 py-3.5 text-muted-foreground sm:px-6">
                        {row.without}
                      </div>
                      <div className="flex items-center border-l border-border/30 bg-green-500/[0.03] px-4 py-3.5 text-foreground sm:px-6">
                        {row.with}
                      </div>
                    </div>
                  ))}
                </div>
              </FadeInView>
            </Container>
          </Section>

          {/* ============================================================ */}
          {/*  FINAL CTA                                                   */}
          {/* ============================================================ */}
          <Section className="relative overflow-hidden border-t border-border/40">
            <GradientOrb position="center" size="lg" color="mixed" />

            <Container className="relative z-10">
              <FadeInView>
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    Ready to Put <GradientText>16 AI Employees</GradientText>{" "}
                    <br className="hidden sm:block" />
                    to Work?
                  </h2>

                  <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                    Start with a free audit to see exactly which AI services
                    will deliver the biggest ROI for your business. No
                    commitment, no pressure.
                  </p>

                  <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link href="/free-audit">
                      <GradientButton
                        size="lg"
                        className="btn-shine px-10 py-3 text-base"
                      >
                        Get Your Free AI Audit
                        <ArrowRight className="h-4 w-4" />
                      </GradientButton>
                    </Link>
                    <Link href="/pricing">
                      <GradientButton
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        See Pricing & Bundles
                        <ArrowRight className="h-4 w-4" />
                      </GradientButton>
                    </Link>
                  </div>

                  {/* Trust badges */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      60-Day Guarantee
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      48-Hour Setup
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Cancel Anytime
                    </div>
                  </div>
                </div>
              </FadeInView>
            </Container>
          </Section>
        </main>

        <Footer />
      </div>
    </>
  );
}

/* ==================================================================== */
/*  ServiceDetailCard — rich card with description, features, badge     */
/* ==================================================================== */
function ServiceDetailCard({ service }: { service: Service }) {
  const Icon = getServiceIcon(service.id);
  const bundleTier = getLowestBundle(service.id);
  const features = service.features.slice(0, 3);

  return (
    <Link href={`/onboarding?service=${service.id}`} className="block h-full">
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.2 }}
        className="group h-full"
      >
        <div
          className={cn(
            "relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300",
            "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          )}
        >
          {/* Popular badge */}
          {service.popular && (
            <div className="absolute right-3 top-3">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Popular
              </span>
            </div>
          )}

          {/* Icon + category */}
          <div className="flex items-start gap-3">
            <IconBadge
              icon={Icon}
              color={service.color}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              <p
                className={cn(
                  "mt-0.5 text-xs font-medium",
                  categoryColors[service.category] || "text-muted-foreground"
                )}
              >
                {categoryLabels[service.category] || service.category}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {service.description}
          </p>

          {/* Features */}
          <ul className="mt-4 space-y-1.5 flex-1">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Footer: tier badge + arrow */}
          <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-4">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                bundleTier === "DIY"
                  ? "bg-teal-500/10 text-teal-400"
                  : bundleTier === "Starter"
                    ? "bg-blue-500/10 text-blue-400"
                    : bundleTier === "Growth"
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-amber-500/10 text-amber-400"
              )}
            >
              Included in {bundleTier}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
