"use client";

import { Users, AlertCircle, RefreshCw, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/shared/FadeInView";
import { LeadRow } from "./LeadRow";
import type { DashboardLead } from "@/types/dashboard";

function LeadTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="hidden h-5 w-16 animate-pulse rounded-full bg-muted sm:block" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

interface LeadTableProps {
  leads: DashboardLead[];
  maxHeight?: string;
  showOutcomeActions?: boolean;
  onOutcomeUpdate?: (leadId: string, status: string, jobValue?: number) => void;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function LeadTable({
  leads,
  maxHeight = "400px",
  showOutcomeActions,
  onOutcomeUpdate,
  isLoading,
  error,
  onRetry,
}: LeadTableProps) {
  return (
    <FadeInView>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
          {leads.length > 0 && !isLoading && !error && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/dashboard/export?type=leads", "_blank")}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LeadTableSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-destructive/60" />
              <p className="text-sm font-medium">Unable to load leads</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We could not fetch your leads right now.
              </p>
              {onRetry && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => onRetry()}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </Button>
              )}
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-lg" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Users className="h-6 w-6 text-blue-400/60" />
                </div>
              </div>
              <p className="text-sm font-semibold">No leads yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Your AI systems are actively working to capture leads. They will appear here in real time as they come in.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] text-muted-foreground">AI lead capture active</span>
              </div>
            </div>
          ) : (
            <ScrollArea className="pr-2" style={{ maxHeight }}>
              <div className="space-y-1">
                {leads.map((lead, i) => (
                  <LeadRow
                    key={lead.id || `${lead.email}-${i}`}
                    lead={lead}
                    showOutcomeActions={showOutcomeActions}
                    onOutcomeUpdate={onOutcomeUpdate}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </FadeInView>
  );
}
