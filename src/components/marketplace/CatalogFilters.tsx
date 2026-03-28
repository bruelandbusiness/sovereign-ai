"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SERVICE_CATEGORIES, SERVICES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface CatalogFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CatalogFilters({
  activeCategory,
  onCategoryChange,
}: CatalogFiltersProps) {
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: SERVICES.length };
    for (const service of SERVICES) {
      counts[service.category] = (counts[service.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="relative w-full">
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none sm:gap-2 sm:justify-center sm:overflow-visible sm:pb-0">
        <AnimatePresence mode="wait">
          {SERVICE_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            const count = categoryCounts[category.id] ?? 0;
            return (
              <motion.button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 rounded-lg gradient-bg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">
                  {category.label}{" "}
                  <span className={cn(
                    "text-xs",
                    isActive ? "text-white/70" : "text-muted-foreground/60"
                  )}>
                    ({count})
                  </span>
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
