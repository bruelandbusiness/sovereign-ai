"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  trialEndsAt: string;
}

export function TrialBanner({ trialEndsAt }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    const endDate = new Date(trialEndsAt);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    setDaysLeft(days);
  }, [trialEndsAt]);

  if (daysLeft === null) return null;

  const isUrgent = daysLeft <= 3;
  const isExpired = daysLeft === 0;

  return (
    <div
      role={isUrgent || isExpired ? "alert" : undefined}
      className={`rounded-xl border p-4 sm:p-5 ${
        isExpired
          ? "border-red-500/30 bg-red-500/10"
          : isUrgent
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-primary/20 bg-primary/5"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Clock
            className={`h-5 w-5 shrink-0 ${
              isExpired
                ? "text-red-400"
                : isUrgent
                ? "text-amber-400"
                : "text-primary"
            }`}
            aria-hidden="true"
          />
          <div>
            {isExpired ? (
              <p className="text-sm font-medium text-red-400">
                Your free trial has ended. Upgrade to keep using Sovereign AI.
              </p>
            ) : (
              <p className="text-sm font-medium">
                <span
                  className={`font-bold ${
                    isUrgent ? "text-amber-400" : "text-primary"
                  }`}
                >
                  {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                </span>{" "}
                left in your free trial
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upgrade to unlock unlimited leads, all AI services, and more.
            </p>
          </div>
        </div>
        <Link href="/dashboard/billing">
          <Button
            size="sm"
            variant={isExpired || isUrgent ? "default" : "outline"}
            className={isExpired ? "bg-red-500 hover:bg-red-600" : ""}
          >
            Upgrade Now
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
