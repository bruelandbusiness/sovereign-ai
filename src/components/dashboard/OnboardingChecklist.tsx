"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import useSWR from "swr";

interface ChecklistStep {
  id: string;
  stepKey: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed");
    return res.json();
  });

export function OnboardingChecklist() {
  const { data: steps, mutate } = useSWR<ChecklistStep[]>(
    "/api/dashboard/checklist",
    fetcher
  );
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem("checklist-dismissed") === "true");
    }
  }, []);

  if (dismissed || !steps || steps.length === 0) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = completedCount === steps.length;

  if (allComplete) return null;

  const progress = Math.round((completedCount / steps.length) * 100);

  const toggleStep = async (stepKey: string, completed: boolean) => {
    await fetch("/api/dashboard/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepKey, completed: !completed }),
    });
    mutate();
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-bg text-xs font-bold text-white">
              {completedCount}/{steps.length}
            </div>
            <div>
              <h3 className="text-sm font-semibold">Getting Started</h3>
              <p className="text-xs text-muted-foreground">
                Complete your setup to get the most from your AI services
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              {collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => {
                localStorage.setItem("checklist-dismissed", "true");
                setDismissed(true);
              }}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full gradient-bg transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {!collapsed && (
          <div className="mt-4 space-y-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => toggleStep(step.stepKey, step.completed)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
              >
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-accent" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={`text-sm ${
                    step.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
