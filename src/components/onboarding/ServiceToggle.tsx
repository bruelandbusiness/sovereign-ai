"use client";

import { createElement } from "react";
import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/constants";
import { getServiceIcon } from "@/lib/service-icons";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/services";

interface ServiceToggleProps {
  service: Service;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  recommended?: boolean;
}

export function ServiceToggle({
  service,
  checked,
  onToggle,
  recommended,
}: ServiceToggleProps) {

  return (
    <div className="relative">
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute -top-2 left-3 z-10 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          Recommended for you
        </div>
      )}

      <button
        type="button"
        onClick={() => onToggle(!checked)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
          checked
            ? "border-transparent bg-primary/5 shadow-[0_0_0_1px_rgba(76,133,255,0.4),0_0_15px_rgba(76,133,255,0.15)]"
            : "border-border bg-background hover:border-primary/30",
          recommended && !checked && "border-primary/20"
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            checked ? "bg-primary/15 text-primary" : service.color
          )}
        >
          {createElement(getServiceIcon(service.id), { className: "h-4 w-4" })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className={cn(
                "text-sm font-medium leading-tight truncate",
                checked ? "text-foreground" : "text-foreground"
              )}
            >
              {service.name}
            </p>
            {service.popular && (
              <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-400">
                Popular
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {formatPrice(service.price)}
              {service.priceSuffix}
            </p>
            {service.popular && (
              <span className="text-[10px] font-medium text-green-400">
                Avg. 5-12x ROI
              </span>
            )}
          </div>
        </div>

        <Switch
          checked={checked}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Toggle ${service.name}`}
        />
      </button>
    </div>
  );
}
