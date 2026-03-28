"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "metric" | "status";
  statusColor?: "success" | "warning" | "danger" | "info";
}

const statusColorMap: Record<string, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--destructive)",
  info: "var(--primary)",
};

export function Card({
  variant = "default",
  statusColor,
  className,
  children,
  ...props
}: CardProps) {
  const topBorderStyle: React.CSSProperties = {};

  if (variant === "metric") {
    topBorderStyle.borderTop = "2px solid var(--primary)";
  } else if (variant === "status" && statusColor) {
    topBorderStyle.borderTop = `2px solid ${statusColorMap[statusColor] ?? "var(--primary)"}`;
  }

  return (
    <div
      className={cn(
        "bg-secondary border border-border p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[rgba(255,255,255,0.14)]",
        className
      )}
      style={{
        borderRadius: "12px",
        ...topBorderStyle,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents — backwards-compatible with shadcn/ui Card API
// ---------------------------------------------------------------------------

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center pt-4", className)} {...props}>
      {children}
    </div>
  );
}
