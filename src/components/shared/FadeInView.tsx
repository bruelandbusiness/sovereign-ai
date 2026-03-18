"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const directions = {
  up: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -24 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } },
};

interface FadeInViewProps {
  children: React.ReactNode;
  direction?: keyof typeof directions;
  delay?: number;
  className?: string;
}

export function FadeInView({
  children,
  direction = "up",
  delay = 0,
  className,
}: FadeInViewProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={directions[direction]}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
