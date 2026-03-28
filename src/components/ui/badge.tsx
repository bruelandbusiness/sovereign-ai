"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "discovered"
  | "enriched"
  | "contacted"
  | "responded"
  | "qualified"
  | "converted"
  | "dead"
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children?: React.ReactNode;
}

const variantStyles: Record<
  BadgeVariant,
  { backgroundColor: string; color: string }
> = {
  discovered: {
    backgroundColor: "rgba(76, 133, 255, 0.12)",
    color: "var(--primary)",
  },
  enriched: {
    backgroundColor: "rgba(76, 133, 255, 0.12)",
    color: "var(--primary)",
  },
  contacted: {
    backgroundColor: "rgba(245, 166, 35, 0.12)",
    color: "var(--warning)",
  },
  responded: {
    backgroundColor: "rgba(34, 211, 161, 0.12)",
    color: "var(--accent)",
  },
  qualified: {
    backgroundColor: "rgba(34, 211, 170, 0.12)",
    color: "var(--success)",
  },
  converted: {
    backgroundColor: "rgba(76, 133, 255, 0.12)",
    color: "#4c85ff",
  },
  dead: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    color: "var(--muted-foreground)",
  },
  default: {
    backgroundColor: "rgba(76, 133, 255, 0.12)",
    color: "var(--primary)",
  },
  secondary: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "var(--muted-foreground)",
  },
  destructive: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    color: "var(--destructive)",
  },
  outline: {
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
};

const defaultLabels: Record<BadgeVariant, string> = {
  discovered: "Discovered",
  enriched: "Enriched",
  contacted: "Contacted",
  responded: "Responded",
  qualified: "Qualified",
  converted: "Converted",
  dead: "Dead",
  default: "",
  secondary: "",
  destructive: "",
  outline: "",
};

export function Badge({ variant = "default", children, className, ...props }: BadgeProps) {
  const styles = variantStyles[variant];
  const borderStyle = variant === "outline" ? "1px solid var(--border)" : "none";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        fontFamily: "var(--font-sans)",
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        border: borderStyle,
      }}
      {...props}
    >
      {children ?? defaultLabels[variant]}
    </span>
  );
}
