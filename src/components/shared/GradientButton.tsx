"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 px-4 text-sm",
  md: "h-10 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

const variantClasses = {
  gradient: "gradient-bg text-white shadow-md hover:opacity-90",
  outline:
    "border border-primary/30 bg-transparent text-primary hover:bg-primary/10",
  ghost: "bg-transparent text-primary hover:bg-primary/10",
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
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
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
