import { cn } from "@/lib/utils";

interface ProductPriceDisplayProps {
  /** Price in cents */
  price: number;
  /** Compare price in cents (optional) */
  comparePrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: { price: "text-lg", compare: "text-xs", badge: "text-[10px] px-1.5 py-0.5" },
  md: { price: "text-2xl", compare: "text-sm", badge: "text-xs px-2 py-0.5" },
  lg: { price: "text-4xl", compare: "text-base", badge: "text-sm px-2.5 py-1" },
};

function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  }).format(dollars);
}

export function ProductPriceDisplay({
  price,
  comparePrice,
  size = "md",
  className,
}: ProductPriceDisplayProps) {
  const savings =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;

  const classes = sizeClasses[size];
  const hasDiscount = !!(comparePrice && comparePrice > price);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-bold text-foreground", classes.price)}>
        {formatDollars(price)}
      </span>
      {hasDiscount && (
        <>
          <s
            className={cn(
              "text-muted-foreground/60",
              classes.compare
            )}
            aria-label={`Original price: ${formatDollars(comparePrice!)}`}
          >
            {formatDollars(comparePrice!)}
          </s>
          <span
            className={cn(
              "inline-flex items-center rounded-full bg-accent/15 font-semibold text-accent",
              classes.badge
            )}
          >
            Save {savings}%
          </span>
        </>
      )}
    </div>
  );
}
