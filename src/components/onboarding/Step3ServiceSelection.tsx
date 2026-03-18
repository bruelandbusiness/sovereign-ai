"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingCart, Sparkles, Tag } from "lucide-react";
import { GradientButton } from "@/components/shared/GradientButton";
import { SERVICES, formatPrice } from "@/lib/constants";
import { ServiceToggle } from "./ServiceToggle";
import type { ServiceSelectionData } from "@/types/onboarding";

interface Step3ServiceSelectionProps {
  defaultValues?: Partial<ServiceSelectionData>;
  onNext: (data: { selectedServices: string[] }) => void;
  onBack: () => void;
}

export function Step3ServiceSelection({
  defaultValues,
  onNext,
  onBack,
}: Step3ServiceSelectionProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    defaultValues?.selectedServices ?? []
  );
  const [error, setError] = useState<string | null>(null);

  const estimatedTotal = useMemo(() => {
    return SERVICES.filter((s) => selectedServices.includes(s.id)).reduce(
      (sum, s) => sum + s.price,
      0
    );
  }, [selectedServices]);

  // Calculate bundle savings estimate (roughly 40% if 3+ services)
  const bundleSavings = useMemo(() => {
    if (selectedServices.length >= 3) {
      return Math.round(estimatedTotal * 0.4);
    }
    return 0;
  }, [selectedServices.length, estimatedTotal]);

  // Mark first 4 services as recommended
  const recommendedServiceIds = useMemo(
    () => SERVICES.slice(0, 4).map((s) => s.id),
    []
  );

  const handleToggle = (serviceId: string, checked: boolean) => {
    setError(null);
    setSelectedServices((prev) =>
      checked ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
    );
  };

  const handleSubmit = () => {
    if (selectedServices.length === 0) {
      setError("Select at least one service to continue.");
      return;
    }
    onNext({ selectedServices });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Select Your Services</h2>
          <p className="text-sm text-muted-foreground">
            Toggle the AI services you want deployed for your business.
          </p>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">
          Businesses like yours typically choose 3-5 services
        </p>
      </div>

      {/* Running total sticky summary */}
      <div className="sticky top-16 z-10 -mx-1 rounded-lg border border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {selectedServices.length}
            </span>{" "}
            {selectedServices.length === 1 ? "service" : "services"} selected
          </span>
          <span className="text-sm font-semibold">
            {formatPrice(estimatedTotal)}
            <span className="font-normal text-muted-foreground">/mo estimated</span>
          </span>
        </div>
        {/* Bundle savings link */}
        <div className="mt-1.5 flex items-center justify-between">
          <Link
            href="/marketplace#bundles"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Tag className="h-3 w-3" />
            Save up to 40% with a bundle &rarr;
          </Link>
          {bundleSavings > 0 && (
            <span className="text-xs font-medium text-green-400">
              You could save {formatPrice(bundleSavings)}/mo with a bundle
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Service grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICES.map((service) => (
          <ServiceToggle
            key={service.id}
            service={service}
            checked={selectedServices.includes(service.id)}
            onToggle={(checked) => handleToggle(service.id, checked)}
            recommended={recommendedServiceIds.includes(service.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <GradientButton
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </GradientButton>
        <GradientButton type="button" size="lg" onClick={handleSubmit}>
          Next
          <ArrowRight className="h-4 w-4" />
        </GradientButton>
      </div>
    </div>
  );
}
