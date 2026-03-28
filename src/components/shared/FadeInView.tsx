"use client";

import { useInView } from "react-intersection-observer";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const directions = {
  up: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } },
};

interface FadeInViewProps {
  children: React.ReactNode;
  direction?: keyof typeof directions;
  delay?: number;
  /** Duration in seconds (default 0.35) */
  duration?: number;
  className?: string;
}

/**
 * Fade-in wrapper triggered by viewport intersection.
 *
 * Uses react-intersection-observer for reliable viewport detection
 * and framer-motion for animation. Respects prefers-reduced-motion.
 */
export function FadeInView({
  children,
  direction = "up",
  delay = 0,
  duration = 0.35,
  className,
}: FadeInViewProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({
    threshold: 0.15,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });

  const variants = directions[direction];

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? "visible" : "hidden"}
      animate={inView ? "visible" : "hidden"}
      variants={
        prefersReduced
          ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
          : variants
      }
      transition={
        prefersReduced
          ? { duration: 0 }
          : { duration, delay, ease: "easeOut" }
      }
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
