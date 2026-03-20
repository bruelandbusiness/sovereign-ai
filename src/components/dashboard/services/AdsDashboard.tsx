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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-context";

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
    isLoading: campaignsLoading,
    mutate: mutateCampaigns,
  } = useSWR<CampaignsResponse>("/api/services/ads/campaigns", fetcher, swrOpts);

  const {
    data: metricsResponse,
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

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <Megaphone className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Ad Management</h1>
            <p className="text-sm text-muted-foreground">
              AI-optimized Google and Meta ad campaigns
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Sample Data Banner */}
      {isMock && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-center gap-2 mb-4" role="status">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sample Data — Connect your Google Ads or Meta Ads account to see real metrics</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6" role="region" aria-label="Campaign metrics">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <p className="text-xs">Total Spend</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatCurrency(m.totalSpend)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <p className="text-xs">Impressions</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatNumber(m.totalImpressions)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MousePointerClick className="h-4 w-4" />
              <p className="text-xs">Clicks</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatNumber(m.totalClicks)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <p className="text-xs">Conversions</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatNumber(m.totalConversions)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MousePointerClick className="h-4 w-4" />
              <p className="text-xs">CTR</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {m.ctr.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs">ROAS</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
              {m.roas.toFixed(1)}x
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Create New Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <p className="text-xs font-medium text-muted-foreground">
                    AI-Generated Ad Copy:
                  </p>
                  <p className="mt-1 text-sm">{generatedCopy}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Create Campaign
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
                      AI Generate Copy
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
                      <td className="py-3 pr-4 tabular-nums">
                        {formatCurrency(campaign.spend)}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        {formatNumber(campaign.clicks)}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">
                        {formatNumber(campaign.conversions)}
                      </td>
                      <td className="py-3">
                        {campaign.status !== "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={togglingId === campaign.id}
                            onClick={() =>
                              handleToggleCampaign(campaign.id, campaign.status)
                            }
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
    </div>
  );
}
