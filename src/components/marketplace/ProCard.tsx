"use client";

import { Star, MapPin, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ProResult {
  clientId: string;
  businessName: string;
  vertical: string;
  verticalLabel: string;
  city: string | null;
  state: string | null;
  services: string[];
  rating: number;
  reviewCount: number;
}

interface ProCardProps {
  pro: ProResult;
  onRequestQuote: (pro: ProResult) => void;
}

const verticalColors: Record<string, string> = {
  hvac: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  plumbing: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  roofing: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  electrical: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  landscaping: "bg-green-500/10 text-green-400 border-green-500/20",
  "general-contractor": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  other: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
        />
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <div key={i} className="relative h-3.5 w-3.5">
          <Star className="absolute h-3.5 w-3.5 text-muted-foreground/30" />
          <div className="absolute overflow-hidden" style={{ width: "50%" }}>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          </div>
        </div>
      );
    } else {
      stars.push(
        <Star
          key={i}
          className="h-3.5 w-3.5 text-muted-foreground/30"
        />
      );
    }
  }

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {stars}
    </div>
  );
}

export function ProCard({ pro, onRequestQuote }: ProCardProps) {
  const colorClass =
    verticalColors[pro.vertical] || verticalColors.other;
  const displayServices = pro.services.slice(0, 4);

  return (
    <div className="group relative rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-ring">
      {/* AI-Powered Badge */}
      <div className="absolute right-4 top-4">
        <div className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
          <Shield className="h-3 w-3" />
          AI-Powered
        </div>
      </div>

      {/* Business Name & Vertical */}
      <div className="mb-3 pr-24">
        <h3 className="font-display text-lg font-semibold leading-tight text-foreground">
          {pro.businessName}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
              colorClass
            )}
          >
            {pro.verticalLabel}
          </span>
        </div>
      </div>

      {/* Location */}
      {(pro.city || pro.state) && (
        <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>
            {[pro.city, pro.state].filter(Boolean).join(", ")}
          </span>
        </div>
      )}

      {/* Rating */}
      <div className="mb-4 flex items-center gap-2">
        <StarRating rating={pro.rating} />
        <span className="text-sm font-medium text-foreground">
          {pro.rating.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">
          ({pro.reviewCount} {pro.reviewCount === 1 ? "review" : "reviews"})
        </span>
      </div>

      {/* Services */}
      {displayServices.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Services
          </p>
          <div className="flex flex-wrap gap-1.5">
            {displayServices.map((service) => (
              <span
                key={service}
                className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground"
              >
                <CheckCircle className="h-3 w-3 text-accent" />
                {service}
              </span>
            ))}
            {pro.services.length > 4 && (
              <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                +{pro.services.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={() => onRequestQuote(pro)}
        className="w-full gradient-bg text-white hover:opacity-90"
      >
        Request Quote
      </Button>
    </div>
  );
}
