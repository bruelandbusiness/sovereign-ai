"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { HomePageClient } from "@/components/home/HomePageClient";
import { JsonLd } from "@/components/shared/JsonLd";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { CountUp } from "@/components/shared/CountUp";

/* ------------------------------------------------------------------ */
/*  Below-fold sections -- dynamically imported with ssr:false to      */
/*  eliminate their JS from the initial page load bundle.              */
/* ------------------------------------------------------------------ */
const BundlePricing = dynamic(
  () => import("@/components/home/BundlePricing").then((m) => ({ default: m.BundlePricing })),
  { ssr: false, loading: () => <div className="min-h-[400px]" /> }
);
const HowItWorks = dynamic(
  () => import("@/components/home/HowItWorks").then((m) => ({ default: m.HowItWorks })),
  { ssr: false, loading: () => <div className="min-h-[400px]" /> }
);
const TestimonialsSection = dynamic(
  () => import("@/components/home/TestimonialsSection").then((m) => ({ default: m.TestimonialsSection })),
  { ssr: false, loading: () => <div className="min-h-[300px]" /> }
);
const CTASection = dynamic(
  () => import("@/components/home/CTASection").then((m) => ({ default: m.CTASection })),
  { ssr: false, loading: () => <div className="min-h-[200px]" /> }
);
const TrustSection = dynamic(
  () => import("@/components/home/TrustSection").then((m) => ({ default: m.TrustSection })),
  { ssr: false, loading: () => <div className="min-h-[300px]" /> }
);
const ROICalculator = dynamic(
  () => import("@/components/home/ROICalculator").then((m) => ({ default: m.ROICalculator })),
  { ssr: false, loading: () => <div className="min-h-[400px]" /> }
);

export function HomePageContent() {
  const demoVideoId = process.env.NEXT_PUBLIC_DEMO_VIDEO_ID;

  return (
    <HomePageClient demoVideoId={demoVideoId}>
      {({ openBooking, openVideo }) => (
        <div className="flex min-h-screen flex-col bg-background page-enter">
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.trysovereignai.com/#organization",
                  name: "Sovereign AI",
                  url: "https://www.trysovereignai.com",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://www.trysovereignai.com/icon-512.png",
                  },
                  description:
                    "Done-for-you AI marketing automation for HVAC, plumbing, roofing, and home service businesses. 16 AI services that generate leads, book appointments, and grow revenue 24/7.",
                  founder: {
                    "@type": "Person",
                    name: "Seth Brueland",
                  },
                  sameAs: [
                    "https://twitter.com/sovereignai",
                    "https://linkedin.com/company/sovereignai",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.trysovereignai.com/#website",
                  url: "https://www.trysovereignai.com",
                  name: "Sovereign AI",
                  description:
                    "AI-Powered Marketing for Local Businesses",
                  publisher: {
                    "@id": "https://www.trysovereignai.com/#organization",
                  },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://www.trysovereignai.com/blog?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  name: "Sovereign AI",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  offers: {
                    "@type": "AggregateOffer",
                    lowPrice: "497",
                    highPrice: "12997",
                    priceCurrency: "USD",
                    offerCount: "4",
                  },
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: "4.9",
                    ratingCount: "500",
                    bestRating: "5",
                  },
                },
              ],
            }}
          />

          <Header onCtaClick={openBooking} />

          <main id="main-content" className="flex-1">
            <HeroSection onCtaClick={openBooking} onDemoClick={demoVideoId ? openVideo : undefined} />

            {/* Social proof logos bar */}
            <ScrollReveal direction="up" delay={0} duration={0.3}>
              <div className="border-y border-border/40 bg-muted/30 py-3">
                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-semibold text-foreground">
                      <CountUp target={500} suffix="+" duration={1.6} />
                    </span>{" "}
                    businesses growing with Sovereign AI
                  </span>
                  <span className="hidden sm:inline text-border">|</span>
                  <span>
                    <span className="font-semibold text-foreground">
                      $<CountUp target={12} suffix="M+" duration={1.4} delay={0.1} />
                    </span>{" "}
                    in revenue generated for clients
                  </span>
                  <span className="hidden sm:inline text-border">|</span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-amber-400">&#9733; 4.9/5</span> average rating
                  </span>
                </div>
              </div>
            </ScrollReveal>

            <ServicesGrid />
            <HowItWorks />
            <Suspense>
              <BundlePricing />
            </Suspense>
            <Suspense>
              <ROICalculator />
            </Suspense>
            <Suspense>
              <TestimonialsSection />
            </Suspense>
            <Suspense>
              <TrustSection />
            </Suspense>
            <Suspense>
              <CTASection onCtaClick={openBooking} />
            </Suspense>
          </main>

          <Footer />
        </div>
      )}
    </HomePageClient>
  );
}
