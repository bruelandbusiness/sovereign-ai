"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { DashboardLead } from "@/types/dashboard";

const statusConfig = {
  qualified: {
    label: "Qualified",
    classes: "bg-blue-500/10 text-blue-400",
  },
  appointment: {
    label: "Appointment",
    classes: "bg-amber-500/10 text-amber-400",
  },
  won: {
    label: "Won",
    classes: "bg-emerald-500/10 text-emerald-400",
  },
  new: {
    label: "New",
    classes: "bg-gray-500/10 text-gray-400",
  },
};

const sourceConfig: Record<string, string> = {
  "AI Voice Agent": "bg-purple-500/10 text-purple-400",
  "Google Ads": "bg-orange-500/10 text-orange-400",
  "Cold Email": "bg-indigo-500/10 text-indigo-400",
  "Google Organic": "bg-green-500/10 text-green-400",
  "Website Chat": "bg-cyan-500/10 text-cyan-400",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface LeadRowProps {
  lead: DashboardLead;
}

export function LeadRow({ lead }: LeadRowProps) {
  const status = statusConfig[lead.status];
  const sourceColor = sourceConfig[lead.source] ?? "bg-muted text-muted-foreground";

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
      <Avatar size="default">
        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
          {getInitials(lead.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{lead.name}</p>
        <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
      </div>

      <span
        className={cn(
          "hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex",
          sourceColor
        )}
      >
        {lead.source}
      </span>

      <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
        {lead.date}
      </span>

      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
          status.classes
        )}
      >
        {status.label}
      </span>
    </div>
  );
}
