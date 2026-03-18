"use client";

import { Target, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { LeadTable } from "@/components/dashboard/LeadTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ActiveServicesCard } from "@/components/dashboard/ActiveServicesCard";
import { GradientButton } from "@/components/shared/GradientButton";
import { useDemoData } from "@/hooks/useDemoData";

export default function DemoPage() {
  const { profile, kpis, leads, activities, services, subscription } = useDemoData();

  const activeServiceIds = services
    .filter((s) => s.status === "active")
    .map((s) => s.serviceId);

  const leadsThisMonth = kpis.find((k) => k.label === "Leads This Month");
  const goalTotal = 60;
  const goalCurrent = typeof leadsThisMonth?.value === "number" ? leadsThisMonth.value : 0;
  const goalPercent = Math.min(100, Math.round((goalCurrent / goalTotal) * 100));

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      {/* Demo banner */}
      <div className="border-b border-primary/20 bg-primary/5 py-3">
        <Container>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Live Demo — This is what your dashboard looks like
              </span>
            </div>
            <Link href="/onboarding">
              <GradientButton size="sm">
                Start Your Free Audit
                <ArrowRight className="h-3.5 w-3.5" />
              </GradientButton>
            </Link>
          </div>
        </Container>
      </div>

      <main className="flex-1 py-8">
        <Container>
          <DashboardHeader profile={profile} />

          {/* Goal banner */}
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    This month&apos;s goal: <span className="text-foreground">{goalTotal} leads</span>{" "}
                    — You&apos;re at{" "}
                    <span className="font-bold text-emerald-400">{goalCurrent}</span>{" "}
                    <span className="text-muted-foreground">({goalPercent}% complete)</span>
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {goalTotal - goalCurrent} to go
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full gradient-bg transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0">
              <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="leads">Leads</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-8">
                    <KPIGrid kpis={kpis} />
                    <div className="grid gap-6 lg:grid-cols-2">
                      <LeadTable leads={leads} maxHeight="380px" />
                      <ActivityFeed activities={activities} maxHeight="380px" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="leads">
                  <LeadTable leads={leads} maxHeight="600px" />
                </TabsContent>

                <TabsContent value="activity">
                  <ActivityFeed activities={activities} maxHeight="600px" />
                </TabsContent>
              </Tabs>
            </div>

            <aside className="hidden space-y-6 lg:block">
              <ActiveServicesCard serviceIds={activeServiceIds} />

              <Card className="border-primary/20 bg-gradient-to-b from-primary/10 to-transparent">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold">Current Plan</h3>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {subscription?.bundleName} Bundle
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ${((subscription?.monthlyAmount || 0) / 100).toLocaleString()}/mo
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </main>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 border-t border-border/40 bg-background/95 py-4 backdrop-blur-xl">
        <Container>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Ready to see these results for your business?
            </p>
            <Link href="/audit">
              <GradientButton className="btn-shine">
                Get Your Free AI Audit
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </Link>
          </div>
        </Container>
      </div>

      <Footer />
    </div>
  );
}
