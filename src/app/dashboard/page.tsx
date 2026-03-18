"use client";

import { Target, ArrowRight, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { LeadTable } from "@/components/dashboard/LeadTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ROISection } from "@/components/dashboard/ROISection";
import { ActiveServicesCard } from "@/components/dashboard/ActiveServicesCard";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import type { ClientProfile } from "@/types/dashboard";

const DEMO_PROFILE: ClientProfile = {
  businessName: "Smith's Heating & Air",
  ownerName: "John Smith",
  initials: "SH",
  city: "Phoenix, AZ",
  vertical: "HVAC",
  plan: "Growth Bundle",
};

export default function DashboardPage() {
  const goalTotal = 60;
  const goalCurrent = 47;
  const goalPercent = Math.round((goalCurrent / goalTotal) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          {/* Client header */}
          <DashboardHeader profile={DEMO_PROFILE} />

          {/* Motivational goal banner */}
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

          {/* Tabs + Sidebar layout */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Main content area */}
            <div className="min-w-0">
              <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="leads">Leads</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="space-y-8">
                    <KPIGrid />

                    <div className="grid gap-6 lg:grid-cols-2">
                      <LeadTable maxHeight="380px" />
                      <ActivityFeed maxHeight="380px" />
                    </div>

                    <ROISection />
                  </div>
                </TabsContent>

                {/* Leads Tab */}
                <TabsContent value="leads">
                  <LeadTable maxHeight="600px" />
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity">
                  <ActivityFeed maxHeight="600px" />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className="hidden space-y-6 lg:block">
              <ActiveServicesCard />
              <SubscriptionCard />

              {/* Upsell card */}
              <Card className="border-primary/20 bg-gradient-to-b from-primary/10 to-transparent">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">Unlock More</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unlock 10 more services with <span className="font-semibold text-foreground">Empire Bundle</span>{" "}
                    — Save $5,500/mo
                  </p>
                  <a
                    href="/services"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    See Empire Benefits
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
