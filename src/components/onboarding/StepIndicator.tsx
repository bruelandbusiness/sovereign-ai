"use client";

import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/types/onboarding";

const STEPS: { number: OnboardingStep; label: string }[] = [
  { number: 1, label: "Business Info" },
  { number: 2, label: "Current Setup" },
  { number: 3, label: "Select Services" },
  { number: 4, label: "Account Access" },
];

interface StepIndicatorProps {
  currentStep: OnboardingStep;
  className?: string;
}

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  const progressPercent = currentStep * 25;

  return (
    <div className={cn("w-full", className)}>
      {/* Time estimate */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>~5 minutes</span>
        </div>
        <span className="text-xs font-medium text-primary">
          {progressPercent}% Complete
        </span>
      </div>

      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isLast = index === STEPS.length - 1;

          return (
            <div
              key={step.number}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 sm:h-10 sm:w-10 sm:text-sm",
                    isCompleted &&
                      "bg-green-500 text-white",
                    isCurrent &&
                      "gradient-bg text-white shadow-md",
                    !isCompleted &&
                      !isCurrent &&
                      "border-2 border-border bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                {/* Label - hidden on mobile, shown on sm+ */}
                <span
                  className={cn(
                    "mt-2 hidden text-center text-xs font-medium sm:block",
                    isCurrent && "text-foreground",
                    isCompleted && "text-green-600 dark:text-green-400",
                    !isCurrent &&
                      !isCompleted &&
                      "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {/* Mobile: show step number label */}
                <span
                  className={cn(
                    "mt-1.5 text-center text-[10px] font-medium sm:hidden",
                    isCurrent && "text-foreground",
                    isCompleted && "text-green-600 dark:text-green-400",
                    !isCurrent &&
                      !isCompleted &&
                      "text-muted-foreground"
                  )}
                >
                  Step {step.number}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="mx-2 h-[2px] flex-1 sm:mx-3">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isCompleted
                        ? "bg-green-500"
                        : "bg-border"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gradient progress bar */}
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="gradient-bg h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
