"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Megaphone,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  Plus,
  Sparkles,
  Pause,
  Play,
  Loader2,
  AlertTriangle,
  Settings,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-context";
import { formatRelative } from "@/lib/date-utils";
import {
  ServiceHero,
  MetricCard,
  ActivityFeed,
  HowItWorks,
  PerformanceChart,
  type ActivityItem,
} from "./ServiceDetailLayout";

// ── Types ────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  platform: "google" | "meta";
  status: "active" | "paused" | "failed";
  dailyBudget: number;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  createdAt: string;
}

interface AdsMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  ctr: number;
  roas: number;
}

interface CampaignsResponse {
  campaigns: Campaign[];
  isMock: boolean;
}

interface MetricsResponse {
  summary: {
    totalSpent: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    ctr: number;
    roas: number;
  };
  isMock: boolean;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  paused: "secondary",
  failed: "destructive",
};

const PLATFORM_COLORS: Record<string, string> = {
  google: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  meta: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

// ── Component ────────────────────────────────────────────────

export function AdsDashboard() {
  const { toast } = useToast();
  const swrOpts = { refreshInterval: 60000, dedupingInterval: 10000, revalidateOnFocus: false } as const;

  const {
    data: campaignsResponse,
    error: campaignsError,
    isLoading: campaignsLoading,
    mutate: mutateCampaigns,
  } = useSWR<CampaignsResponse>("/api/services/ads/campaigns", fetcher, swrOpts);

  const {
    data: metricsResponse,
    error: metricsError,
    isLoading: metricsLoading,
    mutate: mutateMetrics,
  } = useSWR<MetricsResponse>("/api/services/ads/metrics", fetcher, swrOpts);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"google" | "meta">("google");
  const [dailyBudget, setDailyBudget] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dailyBudget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/services/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          platform,
          dailyBudget: parseFloat(dailyBudget),
          adCopy: generatedCopy || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "We couldn't create your campaign. Please check your details and try again.", "error");
        return;
      }
      setName("");
      setDailyBudget("");
      setGeneratedCopy(null);
      setShowForm(false);
      mutateCampaigns();
      mutateMetrics();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateCopy() {
    if (!name.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/services/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-copy", name: name.trim(), platform }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "We couldn't generate ad copy right now. Please try again.", "error");
        return;
      }
      const data = await res.json();
      setGeneratedCopy(data.copy || "AI-optimized ad copy for your campaign.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleToggleCampaign(campaignId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    setTogglingId(campaignId);
    try {
      const res = await fetch("/api/services/ads/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "We couldn't update the campaign. Please try again.", "error");
        return;
      }
      mutateCampaigns();
      mutateMetrics();
    } finally {
      setTogglingId(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (campaignsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="ml-2 text-muted-foreground">Loading ad campaigns...</span>
      </div>
    );
  }

  if (campaignsError || metricsError) {
    return (
      <div className="flex items-center justify-center py-20" role="alert">
        <p className="text-sm text-destructive">
          Failed to load ad campaigns. Make sure the ads service is provisioned.
        </p>
      </div>
    );
  }

  const campaignList = campaignsResponse?.campaigns || [];
  const summary = metricsResponse?.summary;
  const m: AdsMetrics = {
    totalSpend: summary?.totalSpent ?? 0,
    totalImpressions: summary?.totalImpressions ?? 0,
    totalClicks: summary?.totalClicks ?? 0,
    totalConversions: summary?.totalConversions ?? 0,
    ctr: summary?.ctr ?? 0,
    roas: summary?.roas ?? 0,
  };
  const isMock = campaignsResponse?.isMock || metricsResponse?.isMock || false;
  const costPerConversion =
    m.totalConversions > 0
      ? formatCurrency(m.totalSpend / m.totalConversions)
      : "--";
  const activeCampaigns = campaignList.filter((c) => c.status === "active").length;

  // Activity feed from campaigns
  const activityItems: ActivityItem[] = campaignList
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((c) => {
      if (c.conversions > 0) {
        return {
          id: c.id,
          icon: Target,
          iconColor: "text-emerald-400",
          iconBg: "bg-emerald-500/10",
          title: `${c.name}: ${c.conversions} conversion${c.conversions !== 1 ? "s" : ""} generated`,
          description: `${formatNumber(c.clicks)} clicks from ${formatNumber(c.impressions)} impressions on ${c.platform === "google" ? "Google" : "Meta"}`,
          timestamp: formatRelative(c.createdAt),
        };
      }
      return {
        id: c.id,
        icon: c.status === "active" ? Zap : Pause,
        iconColor: c.status === "active" ? "text-blue-400" : "text-muted-foreground",
        iconBg: c.status === "active" ? "bg-blue-500/10" : "bg-muted",
        title: `${c.name} campaign ${c.status}`,
        description: `${c.platform === "google" ? "Google" : "Meta"} Ads -- ${formatCurrency(c.dailyBudget)}/day budget`,
        timestamp: formatRelative(c.createdAt),
      };
    });

  const howItWorksSteps = [
    {
      step: 1,
      title: "Campaign setup",
      description: "AI creates targeted campaigns on Google and Meta, selecting the best keywords, audiences, and ad placements for your service area.",
    },
    {
      step: 2,
      title: "AI-generated ad copy",
      description: "Compelling headlines, descriptions, and calls-to-action are written by AI and A/B tested to find what converts best.",
    },
    {
      step: 3,
      title: "Continuous optimization",
      description: "Bids, targeting, and budget allocation are adjusted in real-time based on performance data to lower your cost per lead.",
    },
    {
      step: 4,
      title: "Conversion tracking",
      description: "Every phone call, form submission, and booking is tracked back to the ad that generated it, so you see exactly what's working.",
    },
  ];

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Hero */}
      <ServiceHero
        serviceName="AI Ad Management"
        tagline="Maximize every ad dollar with AI-optimized campaigns"
        icon={Megaphone}
        iconBg="bg-orange-500/10"
        iconColor="text-orange-400"
        isActive={activeCampaigns > 0}
        sinceDate={campaignList.length > 0 ? campaignList[campaignList.length - 1].createdAt : null}
      />

      {/* Sample Data Banner */}
      {isMock && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-center gap-2" role="status">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sample Data -- Connect your Google Ads or Meta Ads account to see real metrics</span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6" role="region" aria-label="Campaign metrics">
        <MetricCard
          label="Total Spend"
          value={formatCurrency(m.totalSpend)}
          icon={DollarSign}
          iconColor="text-green-400"
          iconBg="bg-green-500/10"
        />
        <MetricCard
          label="Impressions"
          value={formatNumber(m.totalImpressions)}
          icon={Eye}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <MetricCard
          label="Clicks"
          value={formatNumber(m.totalClicks)}
          icon={MousePointerClick}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
          trend={m.ctr > 0 ? `${m.ctr.toFixed(2)}% CTR` : undefined}
          trendUp={m.ctr > 2}
        />
        <MetricCard
          label="Conversions"
          value={formatNumber(m.totalConversions)}
          icon={Target}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          trend={m.totalConversions > 0 ? `${costPerConversion}/conversion` : undefined}
          trendUp
        />
        <MetricCard
          label="ROAS"
          value={`${m.roas.toFixed(1)}x`}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          trend={m.roas > 0 ? `${formatCurrency(m.roas * m.totalSpend)} revenue` : undefined}
          trendUp={m.roas > 1}
        />
        <MetricCard
          label="Active Campaigns"
          value={activeCampaigns}
          icon={Megaphone}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/10"
          trend={`${campaignList.length} total`}
        />
      </div>

      {/* Performance Chart */}
      <PerformanceChart
        title="Ad Performance Over Time"
        description="Daily ad spend and conversion trends for the current billing period."
        color="bg-orange-500/60"
      />

      {/* Activity Feed */}
      <ActivityFeed
        items={activityItems}
        title="Recent Ad Activity"
        emptyMessage="No ad activity yet. Create your first campaign to get started."
      />

      {/* Create Campaign Form + Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Campaign / Form Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {showForm ? "Create New Campaign" : "Campaign Actions"}
              </CardTitle>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Campaign
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showForm ? (
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      placeholder="e.g. Spring HVAC Promo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-platform">Platform</Label>
                    <select
                      id="campaign-platform"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as "google" | "meta")}
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="google">Google Ads</option>
                      <option value="meta">Meta Ads</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="campaign-budget">Daily Budget ($)</Label>
                    <Input
                      id="campaign-budget"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="50"
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(e.target.value)}
                      required
                      aria-describedby="campaign-budget-hint"
                    />
                    <p id="campaign-budget-hint" className="text-[11px] text-muted-foreground">
                      Recommended: $30-100/day for local service businesses.
                    </p>
                  </div>
                </div>

                {generatedCopy && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">AI-Generated Ad Copy:</p>
                    <p className="mt-1 text-sm">{generatedCopy}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Create
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isGenerating || !name.trim()}
                    onClick={handleGenerateCopy}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        AI Copy
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm font-medium text-emerald-400">AI is optimizing your campaigns</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bids, targeting, and ad copy are being continuously tested and refined to maximize your return on ad spend.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeCampaigns} active campaign{activeCampaigns !== 1 ? "s" : ""} running across{" "}
                  {new Set(campaignList.filter((c) => c.status === "active").map((c) => c.platform)).size} platform{new Set(campaignList.filter((c) => c.status === "active").map((c) => c.platform)).size !== 1 ? "s" : ""}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Ad Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-bidding">AI Auto-Bidding</Label>
              <Switch id="auto-bidding" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ab-testing">A/B Testing</Label>
              <Switch id="ab-testing" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="budget-alerts">Budget Alerts</Label>
              <Switch id="budget-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="weekend-pause">Pause on Weekends</Label>
              <Switch id="weekend-pause" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="conversion-tracking">Conversion Tracking</Label>
              <Switch id="conversion-tracking" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Campaigns ({campaignList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignList.length === 0 ? (
            <div className="py-8 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No campaigns yet. Create your first campaign to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Ad campaigns">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Name</th>
                    <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Platform</th>
                    <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Budget</th>
                    <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Spend</th>
                    <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Clicks</th>
                    <th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Conversions</th>
                    <th scope="col" className="pb-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {campaignList.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="py-3 pr-4 font-medium">{campaign.name}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            PLATFORM_COLORS[campaign.platform] || ""
                          }`}
                        >
                          {campaign.platform === "google" ? "Google" : "Meta"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={STATUS_VARIANT[campaign.status] || "secondary"}>
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                        {formatCurrency(campaign.dailyBudget)}/day
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{formatCurrency(campaign.spend)}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatNumber(campaign.clicks)}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatNumber(campaign.conversions)}</td>
                      <td className="py-3">
                        {campaign.status !== "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={togglingId === campaign.id}
                            onClick={() => handleToggleCampaign(campaign.id, campaign.status)}
                            aria-label={`${campaign.status === "active" ? "Pause" : "Resume"} campaign: ${campaign.name}`}
                          >
                            {togglingId === campaign.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : campaign.status === "active" ? (
                              <>
                                <Pause className="mr-1 h-3.5 w-3.5" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="mr-1 h-3.5 w-3.5" />
                                Resume
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <HowItWorks steps={howItWorksSteps} />
    </div>
  );
}
