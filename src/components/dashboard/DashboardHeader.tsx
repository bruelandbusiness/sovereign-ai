"use client";

import { Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/shared/StatusDot";
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
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {profile.businessName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.city} &mdash; {profile.vertical}
            </p>
            <StatusDot status="active" label="All systems active" />
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
