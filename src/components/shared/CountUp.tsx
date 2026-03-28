"use client";

import { useEffect, useState } from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from "framer-motion";
import { useInView } from "react-intersection-observer";

interface CountUpProps {
  /** Target number to count up to */
  target: number;
  /** Text appended after the number (e.g. "+", "/7", "%") */
  suffix?: string;
  /** Text prepended before the number (e.g. "$") */
  prefix?: string;
  /** Duration in seconds (default 1.8) */
  duration?: number;
  /** Delay before counting starts in seconds */
  delay?: number;
  className?: string;
}

/**
 * Count-up number animation triggered when the element enters the viewport.
 *
 * Uses react-intersection-observer for viewport detection and
 * framer-motion's useMotionValue for smooth animation.
 * Respects prefers-reduced-motion by showing the final value immediately.
 */
export function CountUp({
  target,
  suffix = "",
  prefix = "",
  duration = 1.8,
  delay = 0,
  className,
}: CountUpProps) {
  const prefersReduced = useReducedMotion();
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    if (prefersReduced) {
      // Deferred to next frame to avoid synchronous setState inside an
      // effect body, which the React Compiler lint rule flags.
      const raf = requestAnimationFrame(() => setDisplay(target));
      return () => cancelAnimationFrame(raf);
    }

    const controls = animate(count, target, {
      duration,
      delay,
      ease: "easeOut",
    });

    const unsub = rounded.on("change", (v) => setDisplay(v));

    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, count, rounded, target, duration, delay, prefersReduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
