"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { BundlePricing } from "@/components/home/BundlePricing";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Footer } from "@/components/layout/Footer";

// Heavy components loaded dynamically — not needed on initial paint
const BookingModal = dynamic(
  () => import("@/components/home/BookingModal").then((m) => m.BookingModal),
  { ssr: false }
);
const ROICalculator = dynamic(
  () => import("@/components/home/ROICalculator").then((m) => m.ROICalculator),
  { ssr: false }
);
const ExitIntentPopup = dynamic(
  () => import("@/components/shared/ExitIntentPopup").then((m) => m.ExitIntentPopup),
  { ssr: false }
);
const MarketingChatbot = dynamic(
  () => import("@/components/shared/MarketingChatbot").then((m) => m.MarketingChatbot),
  { ssr: false }
);

export function HomePageClient() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const openBooking = () => setBookingOpen(true);

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none"
      >
        Skip to main content
      </a>
      <Header onCtaClick={openBooking} />

      <main id="main-content" className="flex-1">
        <HeroSection onCtaClick={openBooking} />
        <ServicesGrid />
        <HowItWorks />
        <BundlePricing onSelect={openBooking} />
        <ROICalculator />
        <TestimonialsSection />
        <FeaturedProducts />
        <CTASection onCtaClick={openBooking} />
      </main>

      <Footer />

      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} />
      <ExitIntentPopup />
      <MarketingChatbot />
    </div>
  );
}
