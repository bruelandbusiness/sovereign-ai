import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Testimonial } from "@/types/services";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full border border-border/50 bg-card card-hover-lift">
      <CardContent className="flex h-full flex-col gap-4 pt-4">
        {/* Big quotation mark */}
        <span className="font-display text-4xl leading-none gradient-text select-none">
          &ldquo;
        </span>

        {/* Quote */}
        <blockquote className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {testimonial.quote}
        </blockquote>

        {/* Star rating */}
        <div className="flex gap-0.5">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-amber-400 text-amber-400"
            />
          ))}
        </div>

        {/* Attribution + Result badge */}
        <div className="flex items-end justify-between border-t border-border/40 pt-4">
          <div>
            <p className="font-display text-sm font-semibold">
              {testimonial.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {testimonial.business} &middot; {testimonial.location}
            </p>
          </div>
          {testimonial.result && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {testimonial.result}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
