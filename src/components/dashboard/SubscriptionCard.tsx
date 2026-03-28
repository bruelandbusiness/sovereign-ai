"use client";

import Link from "next/link";
import { CreditCard, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/shared/GradientButton";
import { StatusDot } from "@/components/shared/StatusDot";
import { FadeInView } from "@/components/shared/FadeInView";
import { formatPrice } from "@/lib/constants";
import type { SubscriptionInfo } from "@/types/dashboard";

interface SubscriptionCardProps {
  subscription?: SubscriptionInfo | null;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  if (!subscription) {
    return (
      <FadeInView>
        <Card className="card-interactive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No active subscription. Choose a bundle to get started.
            </p>
            <a href="/marketplace">
              <GradientButton className="w-full" size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                View Bundles
              </GradientButton>
            </a>
          </CardContent>
        </Card>
      </FadeInView>
    );
  }

  return (
    <FadeInView>
      <Card className="card-interactive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CreditCard className="h-4 w-4 text-primary" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{subscription.bundleName}</span>
              <StatusDot
                status={subscription.status === "active" ? "active" : "warning"}
                label={subscription.status === "active" ? "Active" : "Past Due"}
              />
            </div>
            <p className="text-2xl font-bold">
              {formatPrice(subscription.monthlyAmount)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {subscription.activeServiceCount} active services
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full" size="md">
                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                Manage Subscription
              </Button>
            </Link>

            <Link href="/marketplace">
              <GradientButton className="w-full" size="sm">
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade to Empire
              </GradientButton>
            </Link>
          </div>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
