"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  /** Label shown above the timer */
  label?: string;
  /** Number of hours from first visit until the offer "expires" */
  hoursFromVisit?: number;
  /** What to show when timer hits zero */
  expiredText?: string;
  /** Visual variant */
  variant?: "inline" | "banner";
}

function getOrCreateDeadline(hoursFromVisit: number): number {
  if (typeof window === "undefined") return Date.now() + hoursFromVisit * 3600 * 1000;

  const key = "sovereign-offer-deadline";
  const stored = localStorage.getItem(key);

  if (stored) {
    const deadline = parseInt(stored, 10);
    if (!isNaN(deadline) && deadline > Date.now()) {
      return deadline;
    }
  }

  const deadline = Date.now() + hoursFromVisit * 3600 * 1000;
  localStorage.setItem(key, String(deadline));
  return deadline;
}

function formatTimeUnit(n: number): string {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({
  label = "Limited-time offer expires in:",
  hoursFromVisit = 48,
  expiredText = "Offer expired — contact us for availability",
  variant = "inline",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const deadline = getOrCreateDeadline(hoursFromVisit);

    function tick() {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setExpired(true);
        setTimeLeft(null);
        return;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft({ hours, minutes, seconds });
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hoursFromVisit]);

  if (expired) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        {expiredText}
      </div>
    );
  }

  if (!timeLeft) return null;

  if (variant === "banner") {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-1 font-mono text-lg font-bold tabular-nums text-primary">
          <span className="rounded bg-primary/10 px-1.5 py-0.5">
            {formatTimeUnit(timeLeft.hours)}
          </span>
          <span className="text-primary/60">:</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5">
            {formatTimeUnit(timeLeft.minutes)}
          </span>
          <span className="text-primary/60">:</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5">
            {formatTimeUnit(timeLeft.seconds)}
          </span>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <Clock className="h-3.5 w-3.5 text-primary" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-bold tabular-nums text-primary">
        {formatTimeUnit(timeLeft.hours)}:{formatTimeUnit(timeLeft.minutes)}:
        {formatTimeUnit(timeLeft.seconds)}
      </span>
    </div>
  );
}
