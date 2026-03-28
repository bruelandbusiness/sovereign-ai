"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "default" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
  children?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-110 hover:shadow-[0_0_20px_rgba(76,133,255,0.25)] active:scale-[0.98]",
  secondary:
    "bg-transparent border border-border text-muted-foreground hover:border-primary hover:text-foreground active:scale-[0.98]",
  ghost:
    "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.98]",
  danger:
    "bg-transparent border border-destructive text-destructive hover:bg-destructive hover:text-white active:scale-[0.98]",
  outline:
    "bg-transparent border border-border text-foreground hover:bg-muted active:scale-[0.98]",
  default:
    "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]",
  destructive:
    "bg-destructive text-white hover:brightness-110 active:scale-[0.98]",
  link:
    "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3.5 py-2 text-xs min-h-[44px] min-w-[44px]",
  md: "px-5 py-2.5 text-sm min-h-[44px]",
  lg: "px-7 py-3 text-base min-h-[44px]",
  icon: "h-11 w-11 p-0",
  "icon-sm": "h-11 w-11 p-0 sm:h-9 sm:w-9",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, children, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        style={{
          fontFamily: "var(--font-sans)",
          borderRadius: "var(--radius, 8px)",
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
