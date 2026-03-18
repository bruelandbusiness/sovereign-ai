"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, TrendingUp } from "lucide-react";
import type { Service } from "@/types/services";
import { formatPrice } from "@/lib/constants";
import { IconBadge } from "@/components/shared/IconBadge";
import { GradientButton } from "@/components/shared/GradientButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MarketplaceServiceCardProps {
  service: Service;
  index: number;
  onLearnMore: (service: Service) => void;
}

export function MarketplaceServiceCard({
  service,
  index,
  onLearnMore,
}: MarketplaceServiceCardProps) {
  const marketRate = service.price * 2;
  const isLeadGen = service.category === "generation";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative flex flex-col rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:glow-primary"
    >
      {service.popular && (
        <Badge
          variant="default"
          className="absolute -top-2.5 right-4 gradient-bg border-0 text-white text-[11px] glow-pulse"
        >
          Popular
        </Badge>
      )}

      {/* "Most businesses add this" tag for lead-generation category */}
      {isLeadGen && (
        <div className="mb-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            <TrendingUp className="h-3 w-3" />
            Most businesses add this
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-start gap-4">
        <IconBadge
          icon={service.icon}
          color={cn(service.color, "text-foreground")}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-tight">{service.name}</h3>
          <p className="mt-0.5 text-sm text-primary">{service.tagline}</p>
        </div>
      </div>

      {/* ROI badge for popular services */}
      {service.popular && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-medium text-accent">
            <TrendingUp className="h-3 w-3" />
            Avg. 5-12x ROI
          </span>
        </div>
      )}

      {/* Description */}
      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
        {service.description}
      </p>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-2">
        {service.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Price */}
      <div className="mb-4 border-t border-border/40 pt-4">
        {/* Market rate crossed out */}
        <div className="mb-1">
          <span className="text-sm text-muted-foreground/60 line-through">
            Market Rate: {formatPrice(marketRate)}
            {service.priceSuffix ? service.priceSuffix : ""}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{formatPrice(service.price)}</span>
          {service.priceSuffix && (
            <span className="text-sm text-muted-foreground">
              {service.priceSuffix}
            </span>
          )}
        </div>
        {service.setupFee && (
          <p className="mt-1 text-xs text-muted-foreground">
            + {formatPrice(service.setupFee)} one-time setup
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <GradientButton size="sm" className="flex-1">
          Get Started
          <ArrowRight className="h-3.5 w-3.5" />
        </GradientButton>
        <GradientButton
          variant="outline"
          size="sm"
          onClick={() => onLearnMore(service)}
        >
          Learn More
        </GradientButton>
      </div>
    </motion.div>
  );
}
