"use client";

import { CreditCard, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/shared/GradientButton";
import { StatusDot } from "@/components/shared/StatusDot";
import { FadeInView } from "@/components/shared/FadeInView";
import { formatPrice } from "@/lib/constants";
import type { SubscriptionInfo } from "@/types/dashboard";

const DEMO_SUBSCRIPTION: SubscriptionInfo = {
  bundleId: "growth",
  bundleName: "Growth Bundle",
  monthlyAmount: 6997,
  activeServiceCount: 6,
  status: "active",
};

export function SubscriptionCard() {
  const sub = DEMO_SUBSCRIPTION;

  return (
    <FadeInView>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CreditCard className="h-4 w-4 text-primary" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{sub.bundleName}</span>
              <StatusDot
                status={sub.status === "active" ? "active" : "warning"}
                label={sub.status === "active" ? "Active" : "Past Due"}
              />
            </div>
            <p className="text-2xl font-bold">
              {formatPrice(sub.monthlyAmount)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {sub.activeServiceCount} active services
            </p>
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full" size="default">
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Manage Subscription
            </Button>

            <GradientButton className="w-full" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade to Empire
            </GradientButton>
          </div>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
