import { cn } from "@/lib/utils";
import type { ProductTier } from "@/types/products";
import { TIER_CONFIG } from "@/types/products";

interface TierBadgeProps {
  tier: ProductTier;
  size?: "sm" | "md";
  className?: string;
}

export function TierBadge({ tier, size = "sm", className }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold uppercase tracking-wider",
        config.badgeClass,
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-3 py-1 text-xs",
        className
      )}
    >
      {config.label}
    </span>
  );
}
