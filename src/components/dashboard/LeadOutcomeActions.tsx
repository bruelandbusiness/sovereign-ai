"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OutcomeStatus = "contacted" | "booked" | "won" | "lost";

interface LeadOutcomeActionsProps {
  leadId: string;
  currentStatus: string;
  /** Called after a successful outcome update */
  onUpdate?: (leadId: string, status: string, jobValue?: number) => void;
}

// Map internal lead statuses to outcome pipeline stages
function getOutcomeStage(status: string): OutcomeStatus | null {
  switch (status) {
    case "new":
      return null; // Can start with "contacted"
    case "qualified":
      return "contacted";
    case "appointment":
      return "booked";
    case "won":
      return "won";
    case "lost":
      return "lost";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeadOutcomeActions({
  leadId,
  currentStatus,
  onUpdate,
}: LeadOutcomeActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValueInput, setShowValueInput] = useState(false);
  const [jobValue, setJobValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const outcomeStage = getOutcomeStage(status);

  const updateOutcome = useCallback(
    async (newStatus: OutcomeStatus, value?: number) => {
      setIsSubmitting(true);
      setError(null);

      // Optimistic update
      const statusMap: Record<string, string> = {
        contacted: "qualified",
        booked: "appointment",
        won: "won",
        lost: "lost",
      };
      const prevStatus = status;
      setStatus(statusMap[newStatus] ?? newStatus);

      try {
        const res = await fetch(`/api/dashboard/leads/${leadId}/outcome`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            jobValue: value,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to update");
        }

        const result = await res.json();
        setStatus(result.status);
        setShowValueInput(false);
        setJobValue("");
        onUpdate?.(leadId, result.status, result.value ?? undefined);
      } catch (err) {
        // Rollback optimistic update
        setStatus(prevStatus);
        setError(err instanceof Error ? err.message : "Update failed");
      } finally {
        setIsSubmitting(false);
      }
    },
    [leadId, status, onUpdate],
  );

  const handleWonSubmit = useCallback(() => {
    const value = parseFloat(jobValue);
    if (isNaN(value) || value <= 0) {
      setError("Enter a valid dollar amount");
      return;
    }
    updateOutcome("won", value);
  }, [jobValue, updateOutcome]);

  // Terminal states
  if (outcomeStage === "won") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
        Won
      </span>
    );
  }

  if (outcomeStage === "lost") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
        Lost
      </span>
    );
  }

  // Job value input for "Won"
  if (showValueInput) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="3500"
            value={jobValue}
            onChange={(e) => setJobValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleWonSubmit();
              if (e.key === "Escape") {
                setShowValueInput(false);
                setJobValue("");
              }
            }}
            className="h-11 sm:h-7 w-28 sm:w-24 pl-5 text-sm sm:text-xs"
            autoFocus
            min={0}
            step={100}
            aria-label="Job value in dollars"
          />
        </div>
        <Button
          size="sm"
          variant="primary"
          className="h-11 sm:h-7 px-3 sm:px-2 text-xs"
          onClick={handleWonSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "..." : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-11 sm:h-7 px-3 sm:px-1.5 text-xs"
          onClick={() => {
            setShowValueInput(false);
            setJobValue("");
            setError(null);
          }}
        >
          Cancel
        </Button>
        {error && <span role="alert" className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  // Pipeline action buttons
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Next action based on current stage */}
      {outcomeStage === null && (
        <Button
          size="sm"
          variant="outline"
          className="h-9 min-h-[44px] sm:h-7 sm:min-h-0 px-3 sm:px-2 text-xs"
          onClick={() => updateOutcome("contacted")}
          disabled={isSubmitting}
        >
          Contacted
        </Button>
      )}

      {(outcomeStage === null || outcomeStage === "contacted") && (
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "h-9 min-h-[44px] sm:h-7 sm:min-h-0 px-3 sm:px-2 text-xs",
            outcomeStage === "contacted" && "border-amber-500/30 text-amber-400",
          )}
          onClick={() => updateOutcome("booked")}
          disabled={isSubmitting}
        >
          Booked
        </Button>
      )}

      {(outcomeStage === null ||
        outcomeStage === "contacted" ||
        outcomeStage === "booked") && (
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "h-9 min-h-[44px] sm:h-7 sm:min-h-0 px-3 sm:px-2 text-xs",
            outcomeStage === "booked" &&
              "border-emerald-500/30 text-emerald-400",
          )}
          onClick={() => setShowValueInput(true)}
          disabled={isSubmitting}
        >
          Won $
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        className="h-9 min-h-[44px] sm:h-7 sm:min-h-0 px-3 sm:px-2 text-xs text-muted-foreground hover:text-red-400"
        onClick={() => updateOutcome("lost")}
        disabled={isSubmitting}
      >
        Lost
      </Button>

      {error && <span role="alert" className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
