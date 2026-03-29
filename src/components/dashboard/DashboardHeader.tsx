"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/shared/FadeInView";
import type { ClientProfile } from "@/types/dashboard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function useRelativeTime(): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Show time since component mounted (simulates last-fetched timestamp)
  const mountTime = useState(() => Date.now())[0];
  const diffMs = now - mountTime;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin === 1) return "1 minute ago";
  return `${diffMin} minutes ago`;
}

interface DashboardHeaderProps {
  profile: ClientProfile;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const greeting = getGreeting();
  const lastUpdated = useRelativeTime();

  return (
    <FadeInView>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-14">
            <AvatarFallback className="bg-primary/20 text-lg font-semibold text-primary">
              {profile.initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {greeting}, {profile.ownerName}
            </p>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {profile.businessName}
            </h1>
            {(profile.city || profile.vertical) && (
              <p className="text-sm text-muted-foreground">
                {profile.city}{profile.city && profile.vertical ? " \u2014 " : ""}{profile.vertical}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              {/* Prominent status indicator with pulse */}
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">All systems active</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden="true" />
                Updated {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        <Link href="/dashboard/billing">
          <Button variant="outline" size="md">
            <Settings className="mr-1.5 h-4 w-4" />
            Manage Subscription
          </Button>
        </Link>
      </div>
    </FadeInView>
  );
}
