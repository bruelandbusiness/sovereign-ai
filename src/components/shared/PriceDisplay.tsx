import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/constants";

const sizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

interface PriceDisplayProps {
  amount: number;
  period?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({
  amount,
  period = "/mo",
  size = "md",
  className,
}: PriceDisplayProps) {
  return (
    <div className={cn("flex items-baseline gap-1", className)}>
      <span className={cn("font-bold", sizes[size])}>
        {formatPrice(amount)}
      </span>
      {period && (
        <span className="text-sm text-muted-foreground">{period}</span>
      )}
    </div>
  );
}
