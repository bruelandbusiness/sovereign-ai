"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Explicit width (inline style). Omit to use Tailwind classes instead. */
  width?: string;
  /** Explicit height (inline style). Defaults to "1rem" when no className provides height. */
  height?: string;
  /** Border radius preset. */
  rounded?: "sm" | "md" | "lg" | "full" | "none";
}

const roundedMap: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  none: "0",
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
};

/**
 * Reusable skeleton placeholder with shimmer animation.
 *
 * Width and height can be controlled via:
 *  - `width` / `height` props (inline style, highest specificity)
 *  - Tailwind utility classes on `className` (e.g. `h-28 w-full rounded-xl`)
 *
 * The shimmer animation comes from the `.skeleton` class in globals.css.
 */
export function Skeleton({
  width,
  height,
  rounded = "md",
  className,
  ...rest
}: SkeletonProps) {
  // Only apply inline styles when explicit props are given, so Tailwind
  // utility classes on `className` are not overridden.
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = width;
  if (height !== undefined) style.height = height;
  // Only set default height when no className is provided (avoids overriding
  // Tailwind h-* classes).
  if (height === undefined && !className) style.height = "1rem";
  style.borderRadius = roundedMap[rounded];

  return (
    <div
      className={cn("skeleton", className)}
      style={style}
      aria-hidden="true"
      {...rest}
    />
  );
}
