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

function SMark({
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

  const glowId = gradientId + "_glow";
  const bgGradId = gradientId + "_bg";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {color === "gradient" && (
          <>
            <linearGradient
              id={gradientId}
              x1="8"
              y1="8"
              x2="56"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#4c85ff" />
              <stop offset="50%" stopColor="#3da8d5" />
              <stop offset="100%" stopColor="#22d3a1" />
            </linearGradient>
            <linearGradient
              id={bgGradId}
              x1="8"
              y1="8"
              x2="56"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#4c85ff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#22d3a1" stopOpacity="0.04" />
            </linearGradient>
          </>
        )}
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Diamond/shield container */}
      <path
        d="M32 3L58 28L32 61L6 28Z"
        fill={color === "gradient" ? `url(#${bgGradId})` : "none"}
        stroke={fill}
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity={0.25}
      />

      {/* Inner diamond outline for depth */}
      <path
        d="M32 9L52 28L32 54L12 28Z"
        fill="none"
        stroke={fill}
        strokeWidth="0.5"
        opacity={0.1}
      />

      {/* Crown/peak accent at top */}
      <path
        d="M25 12L28.5 7L32 11L35.5 7L39 12"
        fill="none"
        stroke={fill}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.5}
        filter={color === "gradient" ? `url(#${glowId})` : undefined}
      />

      {/* Neural S-curve connecting lines */}
      <g
        stroke={fill}
        strokeWidth="0.8"
        opacity={0.3}
      >
        {/* Upper S-curve connections */}
        <line x1="22" y1="22" x2="28" y2="19" />
        <line x1="28" y1="19" x2="36" y2="20" />
        <line x1="36" y1="20" x2="42" y2="23" />
        <line x1="28" y1="19" x2="32" y2="26" />
        <line x1="36" y1="20" x2="32" y2="26" />
        {/* Mid connections */}
        <line x1="22" y1="22" x2="24" y2="30" />
        <line x1="42" y1="23" x2="40" y2="30" />
        <line x1="32" y1="26" x2="24" y2="30" />
        <line x1="32" y1="26" x2="40" y2="30" />
        <line x1="24" y1="30" x2="32" y2="34" />
        <line x1="40" y1="30" x2="32" y2="34" />
        {/* Lower S-curve connections */}
        <line x1="24" y1="30" x2="22" y2="38" />
        <line x1="32" y1="34" x2="22" y2="38" />
        <line x1="32" y1="34" x2="28" y2="40" />
        <line x1="22" y1="38" x2="28" y2="40" />
        <line x1="28" y1="40" x2="36" y2="42" />
        <line x1="36" y1="42" x2="42" y2="38" />
        <line x1="40" y1="30" x2="42" y2="38" />
        <line x1="32" y1="34" x2="36" y2="42" />
      </g>

      {/* Primary S-curve path through nodes */}
      <path
        d="M42 23C42 23 40 18 36 20C32 22 28 19 28 19
           C24 17 22 22 22 22
           C22 26 26 28 32 26
           C38 24 42 28 40 30
           C38 32 28 30 24 30
           C20 30 22 36 22 38
           C22 42 28 40 28 40
           C32 42 36 42 36 42
           C40 42 42 38 42 38"
        fill="none"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={color === "gradient" ? `url(#${glowId})` : undefined}
      />

      {/* Neural network nodes along S-curve */}
      <g filter={color === "gradient" ? `url(#${glowId})` : undefined}>
        {/* Top-right node */}
        <circle cx="42" cy="23" r="2.5" fill={fill} />
        {/* Top-mid-right */}
        <circle cx="36" cy="20" r="2" fill={fill} />
        {/* Top-mid-left */}
        <circle cx="28" cy="19" r="2" fill={fill} />
        {/* Top-left node */}
        <circle cx="22" cy="22" r="2.5" fill={fill} />
        {/* Center-top */}
        <circle cx="32" cy="26" r="1.8" fill={fill} opacity={0.7} />
        {/* Mid-right */}
        <circle cx="40" cy="30" r="2" fill={fill} />
        {/* Mid-left */}
        <circle cx="24" cy="30" r="2" fill={fill} />
        {/* Center */}
        <circle cx="32" cy="34" r="1.8" fill={fill} opacity={0.7} />
        {/* Bottom-left node */}
        <circle cx="22" cy="38" r="2.5" fill={fill} />
        {/* Bottom-mid-left */}
        <circle cx="28" cy="40" r="2" fill={fill} />
        {/* Bottom-mid-right */}
        <circle cx="36" cy="42" r="2" fill={fill} />
        {/* Bottom-right node */}
        <circle cx="42" cy="38" r="2.5" fill={fill} />
      </g>
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
        <SMark size={px} color={color} gradientId={gradientId} />
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
      <SMark size={px} color={color} gradientId={gradientId} />
    </div>
  );
}
