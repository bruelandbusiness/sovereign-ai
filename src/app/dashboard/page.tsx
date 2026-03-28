"use client";

import { ArrowRight, Sparkles, LogOut, CreditCard, Gift, CheckCircle2, CircleDashed, ExternalLink, AlertCircle, RefreshCw, Settings2, BarChart3, Loader2, Users, Headphones } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { DashboardTour, TakeTourButton } from "@/components/dashboard/DashboardTour";
import { useDashboard } from "@/hooks/useDashboard";

// Lazy-load chart panels (recharts is a large dependency)
const DashboardCharts = dynamic(
  () => import("@/components/dashboard/DashboardCharts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2" role="status" aria-label="Loading charts">
        <div className="skeleton h-80 w-full rounded-xl" />
        <div className="skeleton h-80 w-full rounded-xl" />
        <span className="sr-only">Loading charts...</span>
      </div>
    ),
  },
);

// Lazy-load modals that are only shown on demand (keyboard shortcuts)
const KeyboardShortcutsModal = dynamic(
  () => import("@/components/dashboard/KeyboardShortcutsModal").then((m) => m.KeyboardShortcutsModal),
  { ssr: false }
);
const CommandPalette = dynamic(
  () => import("@/components/dashboard/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false }
);
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSession } from "@/lib/auth-context";
import { SERVICES } from "@/lib/constants";
import { getServiceIcon } from "@/lib/service-icons";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Lazy-load heavy tab components to reduce initial bundle size
const ROIRealtimeDashboard = dynamic(
  () => import("@/components/dashboard/ROIRealtimeDashboard").then((m) => m.ROIRealtimeDashboard),
  { loading: () => <div className="flex items-center justify-center py-12" role="status"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span className="sr-only">Loading...</span></div> },
);
const ReferralHub = dynamic(
  () => import("@/components/dashboard/ReferralHub").then((m) => m.ReferralHub),
  { loading: () => <div className="flex items-center justify-center py-12" role="status"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /><span className="sr-only">Loading...</span></div> },
);

export default function DashboardPage() {
  const { user, signOut } = useSession();
  const { showHelp, setShowHelp, showCommandPalette, setShowCommandPalette } = useKeyboardShortcuts();
  const {
    profile,
    kpis,
    leads,
    activities,
    services,
    subscription,
    roiData,
    isLoading,
    kpisLoading,
    leadsLoading,
    activitiesLoading,
    servicesLoading,
    roiLoading,
    kpisError,
    leadsError,
    activitiesError,
    servicesError,
    roiError,
    retryKpis,
    retryLeads,
    retryActivities,
    retryServices,
    retryRoi,
  } = useDashboard();

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
  const activeServiceIds = services
    .filter((s) => s.status === "active")
    .map((s) => s.serviceId);

  // Build a map of service activation data for the Services tab
  const serviceStatusMap = new Map(
    services.map((s) => [s.serviceId, s])
  );

  // Full loading skeleton for the initial page load
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background" role="status" aria-label="Loading dashboard">
        <span className="sr-only">Loading dashboard, please wait...</span>
        <Header variant="minimal" />
        <main className="flex-1 py-8">
          <Container>
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>

            {/* Goal banner skeleton */}
            <div className="mt-6 rounded-xl border border-muted bg-muted/20 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                <div className="h-4 w-64 animate-pulse rounded bg-muted" />
              </div>
              <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-muted" />
            </div>

            {/* KPI grid skeleton */}
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="flex items-start gap-4">
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                      <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Content skeleton */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {[0, 1].map((i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 py-6">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header variant="minimal" />

      <main id="main-content" className="flex-1 py-8" tabIndex={-1}>
        <Container>
          <div className="flex items-center justify-between gap-2" data-tour-step="welcome">
            <div className="min-w-0 flex-1">
              <DashboardHeader profile={displayProfile} />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <TakeTourButton className="hidden sm:inline-flex" />
              <NotificationBell />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link href="/dashboard/support" data-tour-step="support">
                        <Button variant="ghost" size="icon">
                          <Headphones className="h-4 w-4" />
                          <span className="sr-only">Support</span>
                        </Button>
                      </Link>
                    }
                  />
                  <TooltipContent>Support</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Link href="/dashboard/billing" data-tour-step="settings">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <CreditCard className="mr-1.5 h-4 w-4" />
                  Billing
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button variant="ghost" size="icon" className="sm:hidden h-11 w-11">
                          <CreditCard className="h-4 w-4" />
                          <span className="sr-only">Billing</span>
                        </Button>
                      }
                    />
                    <TooltipContent>Billing</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:inline-flex">
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign Out
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon" onClick={signOut} className="sm:hidden h-11 w-11">
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Sign Out</span>
                      </Button>
                    }
                  />
                  <TooltipContent>Sign Out</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Onboarding checklist */}
          <div className="mt-6">
            <OnboardingChecklist />
          </div>

          {/* Quick-nav cards — visible when KPIs are empty (new users) */}
          {kpis.length === 0 && !kpisLoading && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { href: "/dashboard/crm", icon: Users, label: "View Leads", desc: "Track incoming leads" },
                  { href: "/dashboard/performance", icon: BarChart3, label: "Analytics", desc: "See your KPIs" },
                  { href: "/dashboard/support", icon: Headphones, label: "Get Support", desc: "Create a ticket" },
                  { href: "/dashboard/settings/account", icon: Settings2, label: "Settings", desc: "Update your info" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Card className="group/qn cursor-pointer border-border/50 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
                      <CardContent className="flex flex-col items-center p-4 text-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover/qn:bg-primary/20">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="mt-6" data-tour-step="quick-actions">
            <QuickActionsBar />
          </div>

          {/* Motivational goal progress */}
          <div className="mt-5">
            <GoalProgress current={goalCurrent} total={goalTotal} label="leads" />
          </div>

          {/* Business Health Score */}
          <div className="mt-6">
            <HealthScore />
          </div>

          {/* Tabs + Sidebar layout */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Main content area */}
            <div className="min-w-0">
              <Tabs defaultValue="overview">
                <div className="-mx-1 mb-6 overflow-x-auto px-1 pb-1 mobile-scroll-hint [-webkit-overflow-scrolling:touch]">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="leads">Leads</TabsTrigger>
                    <TabsTrigger value="roi">ROI Tracker</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="referrals">
                      <Gift className="mr-1 h-3.5 w-3.5" />
                      Referrals
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="space-y-8">
                    <div data-tour-step="kpis">
                      <KPIGrid
                        kpis={kpis}
                        isLoading={kpisLoading}
                        error={kpisError}
                        onRetry={retryKpis}
                      />
                    </div>

                    {/* Charts — trends + source breakdown */}
                    <div data-tour-step="reports">
                      <DashboardCharts
                        leads={leads}
                        kpis={kpis}
                        roiData={roiData}
                      />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div data-tour-step="leads">
                        <LeadTable
                          leads={leads}
                          maxHeight="380px"
                          isLoading={leadsLoading}
                          error={leadsError}
                          onRetry={retryLeads}
                        />
                      </div>
                      <ActivityFeed
                        activities={activities}
                        maxHeight="380px"
                        isLoading={activitiesLoading}
                        error={activitiesError}
                        onRetry={retryActivities}
                      />
                    </div>

                    <ROISection
                      investment={roiData.investment}
                      revenue={roiData.revenue}
                      roi={roiData.roi}
                      isLoading={roiLoading}
                      error={roiError}
                      onRetry={retryRoi}
                    />
                  </div>
                </TabsContent>

                {/* Leads Tab */}
                <TabsContent value="leads">
                  <LeadTable
                    leads={leads}
                    maxHeight="600px"
                    showOutcomeActions
                    isLoading={leadsLoading}
                    error={leadsError}
                    onRetry={retryLeads}
                  />
                </TabsContent>

                {/* ROI Tracker Tab */}
                <TabsContent value="roi">
                  <ROIRealtimeDashboard />
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity">
                  <ActivityFeed
                    activities={activities}
                    maxHeight="600px"
                    isLoading={activitiesLoading}
                    error={activitiesError}
                    onRetry={retryActivities}
                  />
                </TabsContent>

                {/* Services Tab — All 16 services with real status */}
                <TabsContent value="services">
                  <div className="space-y-5">
                    {/* Header with progress indicator */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">Your AI Services</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Manage and monitor all your AI-powered services
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                          <div className="relative h-8 w-8">
                            <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400" strokeDasharray={`${(activeServiceIds.length / SERVICES.filter(s => s.id !== "custom").length) * 87.96} 87.96`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums">
                              {activeServiceIds.length}
                            </span>
                          </div>
                          <div className="text-xs">
                            <p className="font-semibold">{activeServiceIds.length} of {SERVICES.filter(s => s.id !== "custom").length}</p>
                            <p className="text-muted-foreground">active</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Service activation progress</span>
                        <span className="font-medium tabular-nums">
                          {Math.round((activeServiceIds.length / SERVICES.filter(s => s.id !== "custom").length) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                          style={{ width: `${(activeServiceIds.length / SERVICES.filter(s => s.id !== "custom").length) * 100}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center gap-4 text-[10px] text-muted-foreground" role="list" aria-label="Service status breakdown">
                        <span className="flex items-center gap-1" role="listitem"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" /><span className="font-semibold text-emerald-400">{activeServiceIds.length}</span> Active</span>
                        <span className="flex items-center gap-1" role="listitem"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" /><span className="font-semibold text-amber-400">{services.filter(s => s.status === "configuring").length}</span> Configuring</span>
                        <span className="flex items-center gap-1" role="listitem"><span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" aria-hidden="true" /><span className="font-semibold">{SERVICES.filter(s => s.id !== "custom").length - activeServiceIds.length - services.filter(s => s.status === "configuring").length}</span> Inactive</span>
                      </div>
                    </div>

                    {servicesLoading ? (
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <Card key={i}>
                            <CardContent className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                                <div className="flex-1 space-y-1.5">
                                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : servicesError ? (
                      <Card className="border-destructive/30">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                          <AlertCircle className="mb-3 h-8 w-8 text-destructive/60" />
                          <p className="text-sm font-medium">Unable to load services</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Something went wrong fetching your service status.
                          </p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={() => retryServices()}>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Retry
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {SERVICES.filter((s) => s.id !== "custom").map((service) => {
                          const svcData = serviceStatusMap.get(service.id);
                          const isActive = svcData?.status === "active";
                          const isConfiguring = svcData?.status === "configuring";
                          const Icon = getServiceIcon(service.id);

                          // Route mapping for active service dashboards
                          const serviceRoutes: Record<string, string> = {
                            chatbot: "/dashboard/services/chatbot",
                            reviews: "/dashboard/services/reviews",
                            content: "/dashboard/services/content",
                            voice: "/dashboard/voice",
                            "voice-agent": "/dashboard/voice",
                            crm: "/dashboard/crm",
                            seo: "/dashboard/services/seo",
                            ads: "/dashboard/services/ads",
                            email: "/dashboard/services/email",
                            social: "/dashboard/services/social",
                            booking: "/dashboard/services/booking",
                            analytics: "/dashboard/services/analytics",
                            reputation: "/dashboard/services/reputation",
                            retargeting: "/dashboard/services/retargeting",
                            "lead-gen": "/dashboard/services/lead-gen",
                            website: "/dashboard/services/website",
                          };

                          const href = isActive
                            ? serviceRoutes[service.id] || `/dashboard/services/${service.id}`
                            : isConfiguring
                              ? serviceRoutes[service.id] || `/dashboard/services/${service.id}`
                              : "/services";

                          return (
                            <Card
                              key={service.id}
                              className={cn(
                                "group relative transition-all hover:border-primary/50 hover:shadow-md",
                                isActive && "border-emerald-500/20",
                                isConfiguring && "border-amber-500/20",
                                !isActive && !isConfiguring && "opacity-60 hover:opacity-100"
                              )}
                            >
                              <CardContent className="flex h-full flex-col p-5">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                      isActive ? service.color : isConfiguring ? "bg-amber-500/10" : "bg-muted"
                                    )}
                                  >
                                    <Icon className={cn("h-4.5 w-4.5", !isActive && !isConfiguring && "text-muted-foreground")} />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="truncate text-sm font-semibold">{service.name}</h3>
                                      {isActive ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                                      ) : isConfiguring ? (
                                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-400" aria-hidden="true" />
                                      ) : (
                                        <CircleDashed className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                      )}
                                      <span className="sr-only">
                                        {isActive ? "Active" : isConfiguring ? "Configuring" : "Inactive"}
                                      </span>
                                    </div>

                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                      {service.tagline}
                                    </p>
                                  </div>
                                </div>

                                {/* Status badge row */}
                                <div className="mt-3 flex items-center gap-2">
                                  {isActive ? (
                                    <>
                                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                        Active
                                      </span>
                                      {svcData?.activatedAt && (
                                        <span className="text-[10px] text-muted-foreground">
                                          Since{" "}
                                          {new Date(svcData.activatedAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                      )}
                                    </>
                                  ) : isConfiguring ? (
                                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                      Configuring
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      Inactive
                                    </span>
                                  )}
                                </div>

                                {/* Quick-action button */}
                                <div className="mt-auto pt-3">
                                  <Link href={href} className="w-full">
                                    <Button
                                      variant={isActive ? "outline" : isConfiguring ? "outline" : "ghost"}
                                      size="sm"
                                      className={cn(
                                        "w-full text-xs",
                                        isActive && "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300",
                                        isConfiguring && "border-amber-500/20 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300",
                                      )}
                                    >
                                      {isActive ? (
                                        <>
                                          <BarChart3 className="mr-1.5 h-3 w-3" />
                                          View Analytics
                                        </>
                                      ) : isConfiguring ? (
                                        <>
                                          <Settings2 className="mr-1.5 h-3 w-3" />
                                          Continue Setup
                                        </>
                                      ) : (
                                        <>
                                          <ExternalLink className="mr-1.5 h-3 w-3" />
                                          Learn More
                                        </>
                                      )}
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Referrals Tab */}
                <TabsContent value="referrals">
                  <ReferralHub />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar — desktop: fixed column, mobile: stacked below tabs */}
            <aside className="space-y-6" role="complementary" aria-label="Account summary">
              <div data-tour-step="services">
                <ActiveServicesCard serviceIds={activeServiceIds} />
              </div>
              <SubscriptionCard subscription={subscription} />

              {/* Upsell card */}
              <Card className="border-primary/20 bg-gradient-to-b from-primary/10 to-transparent card-interactive">
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
      <KeyboardShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      <DashboardTour />
    </div>
  );
}
