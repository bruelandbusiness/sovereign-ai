"use client";

import { type ReactNode } from "react";
import { useInView } from "react-intersection-observer";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 20 },
  down: { y: -20 },
  left: { x: -20 },
  right: { x: 20 },
  none: {},
};

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  /** Delay in seconds before animation starts */
  delay?: number;
  /** Duration in seconds (default 0.35 = 350ms) */
  duration?: number;
  /** IntersectionObserver threshold (0-1). Default 0.15 */
  threshold?: number;
  /** Root margin for earlier/later triggering */
  rootMargin?: string;
  /** Only animate once (default true) */
  once?: boolean;
  className?: string;
  /** HTML element to render as */
  as?: "div" | "section" | "article" | "li" | "span";
}

/**
 * Reusable scroll-triggered reveal wrapper.
 *
 * Uses react-intersection-observer for viewport detection and
 * framer-motion for the animation. Automatically respects the
 * user's prefers-reduced-motion setting.
 */
export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.35,
  threshold = 0.15,
  rootMargin = "0px 0px -40px 0px",
  once = true,
  className,
  as = "div",
}: ScrollRevealProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: once,
  });

  const offset = offsets[direction];

  // When user prefers reduced motion, skip animation entirely
  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref}
      initial={
        prefersReduced
          ? { opacity: 1 }
          : { opacity: 0, ...offset }
      }
      animate={
        inView
          ? { opacity: 1, x: 0, y: 0 }
          : prefersReduced
            ? { opacity: 1 }
            : { opacity: 0, ...offset }
      }
      transition={
        prefersReduced
          ? { duration: 0 }
          : { duration, delay, ease: "easeOut" }
      }
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}

/* ------------------------------------------------------------------ */
/*  Stagger group — wraps children so each item staggers in sequence   */
/* ------------------------------------------------------------------ */

interface ScrollRevealGroupProps {
  children: ReactNode;
  /** Base delay before first item animates */
  baseDelay?: number;
  /** Delay increment between each child */
  stagger?: number;
  /** Direction for all children */
  direction?: Direction;
  /** Duration per child */
  duration?: number;
  className?: string;
  rootMargin?: string;
}

/**
 * Container that staggers ScrollReveal animations on its children.
 *
 * Uses a single IntersectionObserver on the container, then applies
 * incremental delays to each direct child via framer-motion variants.
 */
export function ScrollRevealGroup({
  children,
  baseDelay = 0,
  stagger = 0.08,
  direction = "up",
  duration = 0.3,
  className,
  rootMargin = "0px 0px -40px 0px",
}: ScrollRevealGroupProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin,
    triggerOnce: true,
  });

  const offset = offsets[direction];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReduced ? 0 : stagger,
        delayChildren: prefersReduced ? 0 : baseDelay,
      },
    },
  };

  const itemVariants = {
    hidden: prefersReduced
      ? { opacity: 1 }
      : { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: prefersReduced
        ? { duration: 0 }
        : { duration, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={cn(className)}
    >
      {/* Re-export itemVariants so children can use them */}
      {typeof children === "function"
        ? (children as (variants: typeof itemVariants) => ReactNode)(itemVariants)
        : children}
    </motion.div>
  );
}

export type { Direction };
