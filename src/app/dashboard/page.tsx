"use client";

import { Target, ArrowRight, Sparkles, LogOut } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { LeadTable } from "@/components/dashboard/LeadTable";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ROISection } from "@/components/dashboard/ROISection";
import { ActiveServicesCard } from "@/components/dashboard/ActiveServicesCard";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { useDashboard } from "@/hooks/useDashboard";
import { useSession } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user, signOut } = useSession();
  const { profile, kpis, leads, activities, services, subscription, isLoading } =
    useDashboard();

  const displayProfile = profile || {
    businessName: user?.client?.businessName || "Your Business",
    ownerName: user?.client?.ownerName || user?.name || "",
    initials: (user?.client?.businessName || "YB").slice(0, 2).toUpperCase(),
    city: user?.client?.city && user?.client?.state
      ? `${user.client.city}, ${user.client.state}`
      : "",
    vertical: user?.client?.vertical || "",
    plan: subscription?.bundleName || "",
  };

  const leadsThisMonth = kpis.find((k) => k.label === "Leads This Month");
  const goalTotal = 60;
  const goalCurrent =
    typeof leadsThisMonth?.value === "number" ? leadsThisMonth.value : 0;
  const goalPercent =
    goalTotal > 0 ? Math.min(100, Math.round((goalCurrent / goalTotal) * 100)) : 0;

  const activeServiceIds = services
    .filter((s) => s.status === "active")
    .map((s) => s.serviceId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading your dashboard...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DashboardHeader profile={displayProfile} />
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="shrink-0">
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign Out
            </Button>
          </div>

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
                  <TabsTrigger value="services">Services</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="space-y-8">
                    <KPIGrid kpis={kpis} />

                    <div className="grid gap-6 lg:grid-cols-2">
                      <LeadTable leads={leads} maxHeight="380px" />
                      <ActivityFeed activities={activities} maxHeight="380px" />
                    </div>

                    <ROISection />
                  </div>
                </TabsContent>

                {/* Leads Tab */}
                <TabsContent value="leads">
                  <LeadTable leads={leads} maxHeight="600px" />
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity">
                  <ActivityFeed activities={activities} maxHeight="600px" />
                </TabsContent>

                {/* Services Tab */}
                <TabsContent value="services">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Your AI Services</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {activeServiceIds.includes("chatbot") && (
                        <Link href="/dashboard/services/chatbot">
                          <Card className="transition-colors hover:border-primary/50">
                            <CardContent className="p-5">
                              <h3 className="font-semibold">AI Chatbot</h3>
                              <p className="mt-1 text-sm text-muted-foreground">Configure your website chatbot, view conversations</p>
                            </CardContent>
                          </Card>
                        </Link>
                      )}
                      {activeServiceIds.includes("reviews") && (
                        <Link href="/dashboard/services/reviews">
                          <Card className="transition-colors hover:border-primary/50">
                            <CardContent className="p-5">
                              <h3 className="font-semibold">Review Automation</h3>
                              <p className="mt-1 text-sm text-muted-foreground">Manage review campaigns, track ratings</p>
                            </CardContent>
                          </Card>
                        </Link>
                      )}
                      {activeServiceIds.includes("content") && (
                        <Link href="/dashboard/services/content">
                          <Card className="transition-colors hover:border-primary/50">
                            <CardContent className="p-5">
                              <h3 className="font-semibold">Content Engine</h3>
                              <p className="mt-1 text-sm text-muted-foreground">View generated posts, manage content calendar</p>
                            </CardContent>
                          </Card>
                        </Link>
                      )}
                    </div>
                    {activeServiceIds.length === 0 && (
                      <p className="text-sm text-muted-foreground">No services active yet. Complete onboarding to get started.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <aside className="hidden space-y-6 lg:block">
              <ActiveServicesCard serviceIds={activeServiceIds} />
              <SubscriptionCard subscription={subscription} />

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
                    href="/marketplace"
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
