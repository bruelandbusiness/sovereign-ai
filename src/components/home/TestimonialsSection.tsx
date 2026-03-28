"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/Container";
import { TESTIMONIALS } from "@/lib/constants";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-white/10 text-white/10"
          )}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
      containScroll: false,
    },
    [autoplayPlugin.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const prefersReduced = useReducedMotion();
  const { ref: headerRef, inView: headerInView } = useInView({
    threshold: 0.15,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });
  const { ref: carouselRef, inView: carouselInView } = useInView({
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });

  if (TESTIMONIALS.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32"
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4c85ff]/[0.04] blur-[120px]" />
      </div>

      <Container>
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={
            headerInView
              ? { opacity: 1, y: 0 }
              : prefersReduced
                ? { opacity: 1 }
                : { opacity: 0, y: 20 }
          }
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 0.35, ease: "easeOut" }
          }
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Contractors Who Stopped{" "}
            <span className="bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] bg-clip-text text-transparent">
              Losing Jobs to Competitors
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/50">
            Real business owners. Real numbers. No fluff.
          </p>
        </motion.div>

        {/* Embla Carousel */}
        <motion.div
          ref={carouselRef}
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={
            carouselInView
              ? { opacity: 1, y: 0 }
              : prefersReduced
                ? { opacity: 1 }
                : { opacity: 0, y: 16 }
          }
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 0.4, delay: 0.1, ease: "easeOut" }
          }
          className="relative mt-16"
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div
              className="flex touch-pan-y"
              style={{ backfaceVisibility: "hidden" }}
              role="list"
              aria-label="Testimonials"
            >
              {TESTIMONIALS.map((testimonial, index) => (
                <div
                  key={index}
                  className="min-w-0 flex-[0_0_100%] px-3 md:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                  role="listitem"
                  aria-label={`Testimonial from ${testimonial.name}, ${testimonial.business}`}
                >
                  <div
                    className={cn(
                      "h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm transition-all duration-300",
                      "hover:border-white/[0.12] hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Quote icon */}
                    <span className="block select-none bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] bg-clip-text font-display text-5xl leading-none text-transparent">
                      &ldquo;
                    </span>

                    <blockquote className="mt-2 text-base leading-relaxed text-white/80 sm:text-lg">
                      {testimonial.quote}
                    </blockquote>

                    {/* Result badge */}
                    {testimonial.result && (
                      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#22d3a1]/20 bg-[#22d3a1]/[0.08] px-4 py-1.5 text-sm font-medium text-[#22d3a1]">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        {testimonial.result}
                      </div>
                    )}

                    {/* Author info */}
                    <div className="mt-8 flex items-center gap-4 border-t border-white/[0.06] pt-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4c85ff]/30 to-[#22d3a1]/30">
                        <span className="text-sm font-semibold text-white">
                          {getInitials(testimonial.name)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">
                          {testimonial.name}
                        </p>
                        <p className="truncate text-sm text-white/60">
                          {testimonial.business}
                          {testimonial.location
                            ? ` -- ${testimonial.location}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <StarRating rating={testimonial.rating} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next buttons */}
          <button
            onClick={scrollPrev}
            className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.06] bg-black/60 p-2 text-white/50 backdrop-blur-sm transition-all hover:border-[#4c85ff]/40 hover:bg-[#4c85ff]/10 hover:text-white lg:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.06] bg-black/60 p-2 text-white/50 backdrop-blur-sm transition-all hover:border-[#4c85ff]/40 hover:bg-[#4c85ff]/10 hover:text-white lg:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Navigation controls */}
        <div className="mt-10 flex items-center justify-center gap-6">
          {/* Mobile prev button */}
          <button
            onClick={scrollPrev}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/50 transition-all hover:border-[#4c85ff]/40 hover:bg-[#4c85ff]/10 hover:text-white lg:hidden"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Testimonial navigation">
            {scrollSnaps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                role="tab"
                aria-selected={idx === selectedIndex}
                aria-label={`Go to testimonial ${idx + 1}`}
                className="group relative flex h-5 items-center justify-center"
              >
                <motion.div
                  className={cn(
                    "h-2 rounded-full transition-colors",
                    idx === selectedIndex
                      ? "bg-gradient-to-r from-[#4c85ff] to-[#22d3a1]"
                      : "bg-white/20 group-hover:bg-white/40"
                  )}
                  animate={{
                    width: idx === selectedIndex ? 32 : 8,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </button>
            ))}
          </div>

          {/* Mobile next button */}
          <button
            onClick={scrollNext}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/50 transition-all hover:border-[#4c85ff]/40 hover:bg-[#4c85ff]/10 hover:text-white lg:hidden"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </Container>
    </section>
  );
}
