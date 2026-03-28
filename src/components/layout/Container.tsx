import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
}

const sizeMap: Record<NonNullable<ContainerProps["size"]>, string> = {
  sm: "max-w-[640px]",
  md: "max-w-[960px]",
  lg: "max-w-[1280px]",
  full: "max-w-full",
};

export function Container({ children, className, size = "lg" }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 md:px-6",
        sizeMap[size],
        className
      )}
    >
      {children}
    </div>
  );
}

export type { ContainerProps };
