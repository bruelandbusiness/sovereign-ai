"use client";

import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/services";

interface ServiceToggleProps {
  service: Service;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

export function ServiceToggle({
  service,
  checked,
  onToggle,
}: ServiceToggleProps) {
  const Icon = service.icon;

  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
        checked
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-background hover:border-primary/30"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
          checked ? "bg-primary/15 text-primary" : service.color
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-tight truncate",
            checked ? "text-foreground" : "text-foreground"
          )}
        >
          {service.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(service.price)}
          {service.priceSuffix}
        </p>
      </div>

      <Switch
        checked={checked}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
    </button>
  );
}
