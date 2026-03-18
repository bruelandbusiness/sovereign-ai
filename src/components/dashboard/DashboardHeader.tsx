"use client";

import { Settings, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/shared/FadeInView";
import type { ClientProfile } from "@/types/dashboard";

interface DashboardHeaderProps {
  profile: ClientProfile;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
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
              Welcome back, {profile.ownerName}
            </p>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {profile.businessName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.city} &mdash; {profile.vertical}
            </p>
            <p className="text-xs text-muted-foreground">
              Your AI systems have generated <span className="font-semibold text-emerald-400">47 leads</span> and answered <span className="font-semibold text-primary">38 calls</span> this month
            </p>
            <div className="flex items-center gap-3">
              {/* Prominent status indicator with pulse */}
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-medium text-emerald-400">All systems active</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last updated: 2 minutes ago
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline" size="default">
          <Settings className="mr-1.5 h-4 w-4" />
          Manage Subscription
        </Button>
      </div>
    </FadeInView>
  );
}
