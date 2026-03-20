"use client";

import { Check, ArrowRight, ArrowLeft, Phone, Shield, Quote } from "lucide-react";
import type { Service } from "@/types/services";
import { formatPrice, TESTIMONIALS } from "@/lib/constants";
import { getServiceIcon } from "@/lib/service-icons";
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

const WHAT_YOU_GET = [
  "Dedicated account manager",
  "48-hour setup",
  "Monthly reporting",
  "Cancel anytime",
];

/** Pick a testimonial that feels relevant — rotate based on service index. */
function getTestimonialForService(service: Service) {
  const idx =
    service.id.charCodeAt(0) + service.id.charCodeAt(service.id.length - 1);
  return TESTIMONIALS[idx % TESTIMONIALS.length];
}

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

  const testimonial = getTestimonialForService(service);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <IconBadge
              icon={getServiceIcon(service.id)}
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

        {/* What You Get section */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            What You Get
          </h4>
          <ul className="grid grid-cols-2 gap-2">
            {WHAT_YOU_GET.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mini testimonial */}
        <div className="rounded-lg border border-border/40 bg-white/[0.02] p-4">
          <Quote className="mb-2 h-4 w-4 text-primary/40" />
          <p className="text-sm italic leading-relaxed text-muted-foreground">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <p className="mt-2 text-xs font-medium text-foreground">
            {testimonial.name},{" "}
            <span className="text-muted-foreground">{testimonial.business}</span>
          </p>
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

        {/* 30-Day Money-Back Guarantee */}
        <div className="flex items-center justify-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">
            30-Day Money-Back Guarantee
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <GradientButton size="lg" className="flex-1 btn-shine">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </GradientButton>
          <GradientButton variant="outline" size="lg" className="flex-1">
            <Phone className="h-4 w-4" />
            Schedule a Call
          </GradientButton>
        </div>
        <div className="flex justify-center">
          <GradientButton
            variant="ghost"
            size="sm"
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
