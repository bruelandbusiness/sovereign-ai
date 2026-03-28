"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onRate,
  showValue = false,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => {
    const starValue = i + 1;
    const isFilled = starValue <= Math.floor(rating);
    const isHalf = !isFilled && starValue <= rating + 0.5 && starValue > Math.floor(rating);

    const starIcon = (
      <Star
        className={cn(
          sizeMap[size],
          isFilled && "fill-amber-400 text-amber-400",
          isHalf && "fill-amber-400/50 text-amber-400",
          !isFilled && !isHalf && "fill-transparent text-muted-foreground/40"
        )}
        aria-hidden="true"
      />
    );

    if (interactive) {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onRate?.(starValue)}
          className={cn(
            "transition-colors cursor-pointer hover:scale-110"
          )}
          aria-label={`Rate ${starValue} out of ${maxStars} stars`}
        >
          {starIcon}
        </button>
      );
    }

    return (
      <span key={i} className="transition-colors cursor-default">
        {starIcon}
      </span>
    );
  });

  const wrapperProps = interactive
    ? {
        role: "radiogroup" as const,
        "aria-label": "Star rating",
      }
    : {
        role: "img" as const,
        "aria-label": `${rating.toFixed(1)} out of ${maxStars} stars`,
      };

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      {...wrapperProps}
    >
      {stars}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-muted-foreground" aria-hidden="true">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
