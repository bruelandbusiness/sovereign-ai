"use client";

import { motion } from "framer-motion";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CatalogFiltersProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CatalogFilters({
  activeCategory,
  onCategoryChange,
}: CatalogFiltersProps) {
  return (
    <div className="relative w-full">
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none sm:gap-2 sm:justify-center sm:overflow-visible sm:pb-0">
        {SERVICE_CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
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
              <span className="relative z-10">{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
