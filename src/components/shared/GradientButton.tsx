"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-11 px-4 text-sm",
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

const variantClasses = {
  gradient: "gradient-bg text-white shadow-lg hover:shadow-[0_0_30px_rgba(76,133,255,0.3),0_0_60px_rgba(34,211,161,0.1)] hover:brightness-110 active:scale-[0.98]",
  outline:
    "border border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/50 active:scale-[0.98]",
  ghost: "bg-transparent text-primary hover:bg-primary/10 active:scale-[0.98]",
};

interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "gradient" | "outline" | "ghost";
}

export const GradientButton = forwardRef<
  HTMLButtonElement,
  GradientButtonProps
>(({ className, size = "md", variant = "gradient", children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
GradientButton.displayName = "GradientButton";
