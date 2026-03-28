"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description: string;
  timestamp: string;
  /** Optional link for the action button */
  actionHref?: string;
  /** Label for the action link */
  actionLabel?: string;
}

export function ActivityItemRow({
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  title,
  description,
  timestamp,
  actionHref,
  actionLabel,
}: ActivityItemProps) {
  return (
    <div className="group/item flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover/item:scale-105",
          iconColor
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
          <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground tabular-nums">
            {timestamp}
          </span>
        </div>

        {actionHref && (
          <Link
            href={actionHref}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-150 group-hover/item:opacity-100 hover:text-primary/80"
          >
            {actionLabel || "View"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
