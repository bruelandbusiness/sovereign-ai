"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { ServiceCard } from "./ServiceCard";
import { SERVICES, SERVICE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Bento span configs — cycles through a repeating pattern so cards  */
/*  get varying sizes in the 6-col grid.                              */
/* ------------------------------------------------------------------ */
const BENTO_SPANS = [
  { col: "md:col-span-3", row: "" },           // 0  half
  { col: "md:col-span-3", row: "" },           // 1  half
  { col: "md:col-span-2", row: "" },           // 2  third
  { col: "md:col-span-2", row: "md:row-span-2" }, // 3  third + tall
  { col: "md:col-span-2", row: "" },           // 4  third
  { col: "md:col-span-4", row: "" },           // 5  two-thirds
  { col: "md:col-span-2", row: "" },           // 6  third
  { col: "md:col-span-3", row: "" },           // 7  half
  { col: "md:col-span-3", row: "" },           // 8  half
  { col: "md:col-span-2", row: "" },           // 9  third
  { col: "md:col-span-4", row: "" },           // 10 two-thirds
  { col: "md:col-span-3", row: "md:row-span-2" }, // 11 half + tall
  { col: "md:col-span-3", row: "" },           // 12 half
  { col: "md:col-span-2", row: "" },           // 13 third
  { col: "md:col-span-2", row: "" },           // 14 third
  { col: "md:col-span-2", row: "" },           // 15 third
] as const;

function getBentoSpan(index: number) {
  return BENTO_SPANS[index % BENTO_SPANS.length];
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                */
/* ------------------------------------------------------------------ */
function createCardVariants(prefersReduced: boolean | null) {
  return {
    hidden: prefersReduced
      ? { opacity: 1 }
      : { opacity: 0, y: 20, scale: 0.97 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: prefersReduced
        ? { duration: 0 }
        : {
            duration: 0.3,
            delay: i * 0.05,
            ease: "easeOut" as const,
          },
    }),
    exit: prefersReduced
      ? { opacity: 0, transition: { duration: 0 } }
      : {
          opacity: 0,
          y: -12,
          scale: 0.97,
          transition: { duration: 0.2 },
        },
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export function ServicesGrid() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const catTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isInView = useInView(gridRef, { once: true, margin: "-80px" });
  const prefersReduced = useReducedMotion();
  const cardVariants = createCardVariants(prefersReduced);

  const handleCategoryKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIdx = SERVICE_CATEGORIES.findIndex((c) => c.id === activeCategory);
      let nextIdx = currentIdx;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          nextIdx = (currentIdx + 1) % SERVICE_CATEGORIES.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          nextIdx = (currentIdx - 1 + SERVICE_CATEGORIES.length) % SERVICE_CATEGORIES.length;
          break;
        case "Home":
          e.preventDefault();
          nextIdx = 0;
          break;
        case "End":
          e.preventDefault();
          nextIdx = SERVICE_CATEGORIES.length - 1;
          break;
        default:
          return;
      }

      setActiveCategory(SERVICE_CATEGORIES[nextIdx].id);
      catTabRefs.current[nextIdx]?.focus();
    },
    [activeCategory],
  );

  const filteredServices =
    activeCategory === "all"
      ? SERVICES
      : SERVICES.filter((s) => s.category === activeCategory);

  return (
    <section id="services" className="relative py-16 sm:py-20 lg:py-24">
      {/* Subtle radial glow behind the section */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#4c85ff]/[0.04] blur-[120px]" />
      </div>

      <Container>
        {/* ---- Heading ---- */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-[#4c85ff] via-[#22d3a1] to-[#4c85ff] bg-clip-text text-transparent">
              16 AI Services
            </span>{" "}
            Built for
            <br className="hidden sm:block" /> Local Dominance
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every service you need to generate leads, close deals, and build a
            dominant local brand — powered by AI.
          </p>
        </motion.div>

        {/* ---- Category filter tabs ---- */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.3, delay: 0.1, ease: "easeOut" }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
          role="tablist"
          aria-label="Service categories"
          onKeyDown={handleCategoryKeyDown}
        >
          {SERVICE_CATEGORIES.map((cat, index) => (
            <button
              key={cat.id}
              ref={(el) => { catTabRefs.current[index] = el; }}
              role="tab"
              aria-selected={activeCategory === cat.id}
              tabIndex={activeCategory === cat.id ? 0 : -1}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                activeCategory === cat.id
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Animated active pill indicator */}
              {activeCategory === cat.id && (
                <motion.span
                  layoutId="active-category-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#4c85ff] to-[#22d3a1]"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </button>
          ))}
        </motion.div>

        {/* ---- Bento grid ---- */}
        <div ref={gridRef} className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              exit="exit"
              className="grid grid-cols-1 gap-4 md:grid-cols-6"
            >
              {filteredServices.map((service, i) => {
                const span = getBentoSpan(i);
                return (
                  <motion.div
                    key={service.id}
                    custom={i}
                    variants={cardVariants}
                    className={cn(
                      "group relative",
                      span.col,
                      span.row
                    )}
                    whileHover={{
                      y: -4,
                      scale: 1.02,
                      transition: { duration: 0.25 },
                    }}
                  >
                    {/* Hover border glow */}
                    <div
                      className={cn(
                        "pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300",
                        "bg-gradient-to-br from-[#4c85ff]/40 via-[#22d3a1]/20 to-[#4c85ff]/40 blur-sm",
                        "group-hover:opacity-100"
                      )}
                      aria-hidden="true"
                    />
                    <div className="relative h-full">
                      <ServiceCard service={service} />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}
