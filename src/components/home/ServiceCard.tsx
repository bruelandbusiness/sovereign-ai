"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { IconBadge } from "@/components/shared/IconBadge";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import type { Service } from "@/types/services";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const features = service.features.slice(0, 3);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full border border-border/50 bg-card transition-colors duration-200 hover:border-primary/30"
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <IconBadge icon={service.icon} color={service.color} size="lg" />
            {service.popular && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Popular
              </span>
            )}
          </div>
          <div className="mt-3">
            <h3 className="font-display text-base font-semibold leading-snug">
              {service.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {service.tagline}
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          <PriceDisplay
            amount={service.price}
            period={service.priceSuffix}
            size="sm"
          />

          <ul className="space-y-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
