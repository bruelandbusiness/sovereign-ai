import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

interface IconBadgeProps {
  icon: LucideIcon;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconBadge({
  icon: Icon,
  color = "bg-primary/10 text-primary",
  size = "md",
  className,
}: IconBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg",
        sizes[size],
        color,
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
}
