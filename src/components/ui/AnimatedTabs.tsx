"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedTabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  items: AnimatedTabItem[];
  defaultValue?: string;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

export function AnimatedTabs({
  items,
  defaultValue,
  className,
  tabsClassName,
  contentClassName,
}: AnimatedTabsProps) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value ?? "");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIdx = items.findIndex((item) => item.value === active);
      let nextIdx = currentIdx;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          nextIdx = (currentIdx + 1) % items.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          nextIdx = (currentIdx - 1 + items.length) % items.length;
          break;
        case "Home":
          e.preventDefault();
          nextIdx = 0;
          break;
        case "End":
          e.preventDefault();
          nextIdx = items.length - 1;
          break;
        default:
          return;
      }

      setActive(items[nextIdx].value);
      tabRefs.current[nextIdx]?.focus();
    },
    [active, items],
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Tab list */}
      <div
        role="tablist"
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex w-fit items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 backdrop-blur-sm",
          tabsClassName,
        )}
      >
        {items.map((item, index) => {
          const isActive = active === item.value;
          return (
            <button
              key={item.value}
              id={`tab-${item.value}`}
              ref={(el) => { tabRefs.current[index] = el; }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.value}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(item.value)}
              className={cn(
                "relative z-10 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 min-h-[44px] text-sm font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              {/* Animated highlight background */}
              {isActive && (
                <motion.div
                  layoutId="animated-tab-highlight"
                  className="absolute inset-0 rounded-lg bg-white/[0.08] shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content with animation */}
      <div
        className={cn(
          "relative min-h-[120px] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.01]",
          contentClassName,
        )}
      >
        <AnimatePresence mode="wait">
          {items.map(
            (item) =>
              item.value === active && (
                <motion.div
                  key={item.value}
                  id={`tabpanel-${item.value}`}
                  role="tabpanel"
                  tabIndex={0}
                  aria-labelledby={`tab-${item.value}`}
                  initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="p-6"
                >
                  {item.content}
                </motion.div>
              ),
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
