"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  variant?: "default" | "card";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        variant === "card" &&
          "rounded-2xl border border-white/[0.06] bg-white/[0.01] px-8",
        className,
      )}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] text-muted-foreground [&>svg]:h-8 [&>svg]:w-8"
        >
          {icon}
        </motion.div>
      )}

      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {action && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={action.onClick}
          className="mt-6 rounded-xl bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
