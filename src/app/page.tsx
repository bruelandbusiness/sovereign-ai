"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { BundlePricing } from "@/components/home/BundlePricing";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import { BookingModal } from "@/components/home/BookingModal";

export default function HomePage() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const openBooking = () => setBookingOpen(true);

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header onCtaClick={openBooking} />

      <main className="flex-1">
        <HeroSection onCtaClick={openBooking} />
        <ServicesGrid />
        <HowItWorks />
        <BundlePricing onSelect={openBooking} />
        <TestimonialsSection />
        <CTASection onCtaClick={openBooking} />
      </main>

      <Footer />

      <BookingModal open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
}
