"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LeadOutcomeActions } from "./LeadOutcomeActions";
import type { DashboardLead } from "@/types/dashboard";

const statusConfig: Record<string, { label: string; classes: string }> = {
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
  lost: {
    label: "Lost",
    classes: "bg-red-500/10 text-red-400",
  },
  new: {
    label: "New",
    classes: "bg-muted text-muted-foreground",
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

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-muted-foreground";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Hot";
  if (score >= 40) return "Warm";
  if (score >= 20) return "Nurturing";
  return "New";
}

interface LeadRowProps {
  lead: DashboardLead;
  showOutcomeActions?: boolean;
  onOutcomeUpdate?: (leadId: string, status: string, jobValue?: number) => void;
}

export function LeadRow({ lead, showOutcomeActions, onOutcomeUpdate }: LeadRowProps) {
  const status = statusConfig[lead.status] || statusConfig.new;
  const sourceColor = sourceConfig[lead.source] ?? "bg-muted text-muted-foreground";
  const [copied, setCopied] = useState(false);

  const copyEmail = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(lead.email).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [lead.email],
  );

  return (
    <div className="group/row flex items-center gap-3 rounded-lg px-3 py-3 sm:py-2.5 min-h-[56px] transition-colors hover:bg-muted/50">
      <Avatar size="default">
        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
          {getInitials(lead.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{lead.name}</p>
        <div className="flex items-center gap-1">
          <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
          <button
            onClick={copyEmail}
            className="shrink-0 rounded p-2 min-h-[44px] min-w-[44px] sm:p-0.5 sm:min-h-0 sm:min-w-0 flex items-center justify-center text-muted-foreground/0 transition-all group-hover/row:text-muted-foreground hover:!text-primary focus-visible:text-muted-foreground"
            aria-label={copied ? "Email copied" : `Copy ${lead.email}`}
            title={copied ? "Copied!" : "Copy email"}
          >
            {copied ? (
              <Check className="h-4 w-4 sm:h-3 sm:w-3 text-emerald-400 copy-confirm" />
            ) : (
              <Copy className="h-4 w-4 sm:h-3 sm:w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Lead Score */}
      {lead.score != null && (
        <div className="hidden shrink-0 items-center gap-1.5 lg:flex" title={`Lead score: ${lead.score}/100 (${getScoreLabel(lead.score)})`}>
          <div className="h-1.5 w-10 rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                lead.score >= 70 ? "bg-emerald-400" : lead.score >= 40 ? "bg-amber-400" : "bg-muted-foreground/40"
              )}
              style={{ width: `${lead.score}%` }}
            />
          </div>
          <span className={cn("text-[10px] font-semibold tabular-nums", getScoreColor(lead.score))}>
            {lead.score}
          </span>
        </div>
      )}

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

      {showOutcomeActions && lead.id && (
        <div className="hidden shrink-0 xl:block">
          <LeadOutcomeActions
            leadId={lead.id}
            currentStatus={lead.status}
            onUpdate={onOutcomeUpdate}
          />
        </div>
      )}
    </div>
  );
}
