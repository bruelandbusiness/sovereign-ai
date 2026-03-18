"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type LogoVariant = "mark" | "wordmark" | "logotype";
type LogoSize = "xs" | "sm" | "md" | "lg" | "xl" | number;
type LogoColor = "gradient" | "white" | "dark";

interface SovereignLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  color?: LogoColor;
  className?: string;
}

const sizeMap: Record<string, number> = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const textSizeMap: Record<string, string> = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
};

function ShieldMark({
  size,
  color,
  gradientId,
}: {
  size: number;
  color: LogoColor;
  gradientId: string;
}) {
  const fill =
    color === "white"
      ? "#ffffff"
      : color === "dark"
        ? "#0a0a0f"
        : `url(#${gradientId})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {color === "gradient" && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#4c85ff" />
            <stop offset="100%" stopColor="#22d3a1" />
          </linearGradient>
        </defs>
      )}
      {/* Back chevron — left side of shield */}
      <path
        d="M16 2 L4 10 L4 20 L16 30 L16 18 L10 14 L16 10 Z"
        fill={fill}
        opacity={color === "gradient" ? 0.7 : 0.6}
      />
      {/* Front chevron — right side of shield */}
      <path
        d="M16 2 L28 10 L28 20 L16 30 L16 18 L22 14 L16 10 Z"
        fill={fill}
      />
    </svg>
  );
}

export function SovereignLogo({
  variant = "mark",
  size = "md",
  color = "gradient",
  className,
}: SovereignLogoProps) {
  const gradientId = useId().replace(/:/g, "_") + "_sov";
  const px = typeof size === "number" ? size : sizeMap[size] ?? 32;
  const textClass =
    typeof size === "string" ? textSizeMap[size] ?? "text-lg" : "text-lg";

  const textColor =
    color === "white"
      ? "text-white"
      : color === "dark"
        ? "text-[#0a0a0f]"
        : "text-foreground";

  if (variant === "logotype") {
    return (
      <span
        className={cn(
          "font-display font-bold tracking-tight",
          textClass,
          color === "gradient" ? "gradient-text" : textColor,
          className
        )}
      >
        SOVEREIGN AI
      </span>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <ShieldMark size={px} color={color} gradientId={gradientId} />
        <span
          className={cn(
            "font-display font-bold tracking-tight",
            textClass,
            textColor
          )}
        >
          SOVEREIGN AI
        </span>
      </div>
    );
  }

  // mark
  return (
    <div className={className}>
      <ShieldMark size={px} color={color} gradientId={gradientId} />
    </div>
  );
}
