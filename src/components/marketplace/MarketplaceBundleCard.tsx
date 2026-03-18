"use client";

import { ArrowRight } from "lucide-react";
import type { Bundle } from "@/types/services";
import { formatPrice, getServiceById } from "@/lib/constants";
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

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1",
        bundle.popular
          ? "border-primary/40 glow-primary"
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
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold">
            {formatPrice(bundle.price)}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        <span className="mt-1 inline-block text-sm font-medium text-accent">
          {bundle.savings}
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
                    icon={service.icon}
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
      <div className="mt-auto">
        <GradientButton
          size="lg"
          className="w-full"
          variant={bundle.popular ? "gradient" : "outline"}
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </GradientButton>
      </div>
    </div>
  );
}
