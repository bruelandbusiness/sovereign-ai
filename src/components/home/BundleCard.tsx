"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shield } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GradientButton } from "@/components/shared/GradientButton";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { getServiceById, formatPrice } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import type { Bundle } from "@/types/services";
import { cn } from "@/lib/utils";

interface BundleCardProps {
  bundle: Bundle;
  annual?: boolean;
}

const COST_PER_LEAD: Record<string, string> = {
  diy: "16",
  starter: "23",
  growth: "23",
  empire: "43",
};

/** Total value if each service were purchased individually */
const INDIVIDUAL_VALUE: Record<string, number> = {
  diy: 2291,
  starter: 3794,
  growth: 9497,
  empire: 22488,
};

/** Benefit-driven CTA copy per plan */
const CTA_COPY: Record<string, string> = {
  diy: "Start Capturing Leads Today",
  starter: "Start Getting More Leads Today",
  growth: "Start Dominating My Market",
  empire: "Unlock All 16 AI Systems Now",
};

export function BundleCard({ bundle, annual = false }: BundleCardProps) {
  const resolvedServices = bundle.services
    .map((id) => getServiceById(id))
    .filter(Boolean);
  const costPerLead = COST_PER_LEAD[bundle.id];
  const individualValue = INDIVIDUAL_VALUE[bundle.id];
  const currentPrice = annual ? bundle.annualPrice : bundle.price;
  const dailyPrice = Math.round(currentPrice / 30);
  const annualSavings = (bundle.price - bundle.annualPrice) * 12;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative h-full",
        bundle.popular && "z-10 md:scale-105"
      )}
    >
      {bundle.popular && (
        <div className="absolute -top-5 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-1">
          <span className="rounded-full bg-primary/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            Recommended
          </span>
          <span className="rounded-full gradient-bg px-4 py-1 text-xs font-semibold text-white shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      <Card
        className={cn(
          "flex h-full flex-col border glass-card",
          bundle.popular
            ? "border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20 glow-pulse"
            : "border-border/50 card-hover-lift"
        )}
      >
        <CardHeader className={cn("text-center", bundle.popular && "pt-10")}>
          <h3 className="font-display text-xl font-bold">{bundle.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {bundle.description}
          </p>

          {/* Value stacking — show total value before price */}
          {individualValue && (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="line-through">{formatPrice(individualValue)}/mo value</span>
            </p>
          )}

          <div className="mt-2 flex flex-col items-center">
            <PriceDisplay amount={currentPrice} size="lg" />
            {/* Daily price framing */}
            <span className="mt-0.5 text-xs font-medium text-accent">
              Just {formatCurrency(dailyPrice)}/day
            </span>
            {annual && (
              <span className="mt-1 text-xs text-muted-foreground line-through">
                {formatCurrency(bundle.price)}/mo
              </span>
            )}
            {bundle.savings && (
              <span className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
                {annual
                  ? `Save ${formatPrice(annualSavings)}/yr`
                  : bundle.savings}
              </span>
            )}
            {bundle.popular && (
              <span className="mt-2 text-xs text-muted-foreground">
                94% of clients choose this plan
              </span>
            )}
            {costPerLead && (
              <p className="mt-1 text-xs text-muted-foreground">
                ~${costPerLead}/lead vs $150+ on Google Ads
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between gap-6">
          <ul className="space-y-2.5">
            {resolvedServices.map((service) =>
              service ? (
                <li
                  key={service.id}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <Check className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">{service.name}</span>
                </li>
              ) : null
            )}
          </ul>

          <div className="flex flex-col gap-3">
            <Link href={`/onboarding?bundle=${bundle.id}`}>
              <GradientButton
                variant={bundle.popular ? "gradient" : "outline"}
                size="lg"
                className={cn("w-full", bundle.popular && "btn-shine")}
              >
                {CTA_COPY[bundle.id] || "Start My 14-Day Trial"}
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </Link>

            {/* Risk reversal — guarantee near CTA */}
            <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-accent">
              <Shield className="h-3 w-3" />
              60-day money-back guarantee
            </p>
            <p className="text-center text-xs text-muted-foreground">
              Includes free onboarding ($2,500 value) &middot; No contracts
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
