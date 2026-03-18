import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Testimonial } from "@/types/services";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full border border-border/50 bg-card">
      <CardContent className="flex h-full flex-col gap-4 pt-2">
        {/* Star rating */}
        <div className="flex gap-0.5">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-amber-400 text-amber-400"
            />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Attribution */}
        <div className="border-t border-border/40 pt-4">
          <p className="font-display text-sm font-semibold">
            {testimonial.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {testimonial.business} &middot; {testimonial.location}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
