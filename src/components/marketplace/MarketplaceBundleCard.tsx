"use client";

import { useMemo } from "react";
import { ArrowRight, Gift } from "lucide-react";
import type { Bundle } from "@/types/services";
import { formatPrice, getServiceById } from "@/lib/constants";
import { getServiceIcon } from "@/lib/service-icons";
import { IconBadge } from "@/components/shared/IconBadge";
import { GradientButton } from "@/components/shared/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MarketplaceBundleCardProps {
  bundle: Bundle;
}

export function MarketplaceBundleCard({ bundle }: MarketplaceBundleCardProps) {
  const services = bundle.services
    .map((id) => getServiceById(id))
    .filter(Boolean);

  const individualTotal = useMemo(
    () =>
      bundle.services.reduce((sum, id) => {
        const svc = getServiceById(id);
        return sum + (svc?.price ?? 0);
      }, 0),
    [bundle.services]
  );

  const monthlySavings = individualTotal - bundle.price;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1",
        bundle.popular
          ? "border-primary/40 glow-pulse scale-[1.03] z-10"
          : "border-border/60 hover:border-primary/30 hover:glow-primary"
      )}
    >
      {bundle.popular && (
        <Badge
          variant="default"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 gradient-bg border-0 text-white text-[11px]"
        >
          Most Popular
        </Badge>
      )}

      {/* Header */}
      <div className="mb-3 text-center">
        <h3 className="text-xl font-bold">{bundle.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {bundle.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-4 text-center">
        {/* Individual price strikethrough */}
        <p className="mb-1 text-sm text-muted-foreground/60 line-through">
          {formatPrice(individualTotal)}/mo individually
        </p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold">
            {formatPrice(bundle.price)}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        {/* "You save $X/mo" in accent/green */}
        <span className="mt-1 inline-block text-sm font-semibold text-accent">
          You save {formatPrice(monthlySavings)}/mo
        </span>
      </div>

      {/* Free onboarding callout */}
      <div className="mb-4 flex items-center justify-center gap-2 rounded-md border border-accent/20 bg-accent/5 px-3 py-2">
        <Gift className="h-4 w-4 text-accent" />
        <span className="text-xs font-medium text-accent">
          Free onboarding ($2,500 value)
        </span>
      </div>

      {/* Included services icons */}
      <div className="mb-5 border-t border-border/40 pt-4">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {services.length} Services Included
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {services.map((service) =>
            service ? (
              <Tooltip key={service.id}>
                <TooltipTrigger>
                  <IconBadge
                    icon={getServiceIcon(service.id)}
                    color={cn(service.color, "text-foreground")}
                    size="sm"
                    className="transition-transform duration-200 hover:scale-110"
                  />
                </TooltipTrigger>
                <TooltipContent>{service.name}</TooltipContent>
              </Tooltip>
            ) : null
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto space-y-2">
        <GradientButton
          size="lg"
          className={cn("w-full", bundle.popular && "btn-shine")}
          variant={bundle.popular ? "gradient" : "outline"}
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </GradientButton>
        <p className="text-center text-xs text-muted-foreground">
          Cancel anytime &mdash; no contracts
        </p>
      </div>
    </div>
  );
}
