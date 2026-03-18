"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description: string;
  timestamp: string;
}

export function ActivityItemRow({
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  title,
  description,
  timestamp,
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          iconColor
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
        {timestamp}
      </span>
    </div>
  );
}
