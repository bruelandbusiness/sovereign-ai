"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GradientButton } from "@/components/shared/GradientButton";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { getServiceById, formatPrice } from "@/lib/constants";
import type { Bundle } from "@/types/services";
import { cn } from "@/lib/utils";

interface BundleCardProps {
  bundle: Bundle;
  onSelect?: () => void;
}

export function BundleCard({ bundle, onSelect }: BundleCardProps) {
  const resolvedServices = bundle.services
    .map((id) => getServiceById(id))
    .filter(Boolean);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn("relative h-full", bundle.popular && "z-10")}
    >
      {bundle.popular && (
        <div className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2">
          <span className="rounded-full gradient-bg px-4 py-1 text-xs font-semibold text-white shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      <Card
        className={cn(
          "flex h-full flex-col border bg-card",
          bundle.popular
            ? "border-primary/40 shadow-lg shadow-primary/5 ring-1 ring-primary/20"
            : "border-border/50"
        )}
      >
        <CardHeader className="text-center">
          <h3 className="font-display text-xl font-bold">{bundle.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {bundle.description}
          </p>

          <div className="mt-4 flex flex-col items-center">
            <PriceDisplay amount={bundle.price} size="lg" />
            {bundle.savings && (
              <span className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
                {bundle.savings}
              </span>
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

          <GradientButton
            variant={bundle.popular ? "gradient" : "outline"}
            size="lg"
            className="w-full"
            onClick={onSelect}
          >
            Get Started
          </GradientButton>
        </CardContent>
      </Card>
    </motion.div>
  );
}
