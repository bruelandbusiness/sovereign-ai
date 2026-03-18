"use client";

import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import type { Service } from "@/types/services";
import { formatPrice } from "@/lib/constants";
import { IconBadge } from "@/components/shared/IconBadge";
import { GradientButton } from "@/components/shared/GradientButton";
import { GradientText } from "@/components/shared/GradientText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ServiceDetailModalProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceDetailModal({
  service,
  open,
  onOpenChange,
}: ServiceDetailModalProps) {
  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <IconBadge
              icon={service.icon}
              color={cn(service.color, "text-foreground")}
              size="lg"
            />
            <div>
              <DialogTitle className="text-xl font-bold">
                {service.name}
              </DialogTitle>
              <p className="mt-0.5 text-sm">
                <GradientText>{service.tagline}</GradientText>
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          {service.description}
        </DialogDescription>

        {/* Features list */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            What&apos;s Included
          </h4>
          <ul className="space-y-2.5">
            {service.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                  <Check className="h-3 w-3 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold">
              {formatPrice(service.price)}
            </span>
            {service.priceSuffix && (
              <span className="text-sm text-muted-foreground">
                {service.priceSuffix}
              </span>
            )}
          </div>
          {service.setupFee && (
            <p className="mt-1 text-xs text-muted-foreground">
              + {formatPrice(service.setupFee)} one-time setup fee
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <GradientButton size="lg" className="flex-1">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </GradientButton>
          <GradientButton
            variant="ghost"
            size="lg"
            onClick={() => onOpenChange(false)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
