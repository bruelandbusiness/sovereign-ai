"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatShort } from "@/lib/date-utils";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  Users,
  Copy,
  CheckCircle2,
  Loader2,
  UserPlus,
  DollarSign,
  Clock,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ────────────────────────────────────────────────────

interface ReferralConfig {
  enabled: boolean;
  rewardText: string;
  rewardAmount: number;
  terms: string;
}

interface ReferralStats {
  totalReferrals: number;
  pending: number;
  contacted: number;
  converted: number;
  rewarded: number;
}

interface CustomerReferral {
  id: string;
  referrerName: string;
  referrerPhone: string | null;
  referrerEmail: string | null;
  referredName: string | null;
  referredPhone: string | null;
  referredEmail: string | null;
  code: string;
  reward: string;
  status: string;
  convertedAt: string | null;
  rewardedAt: string | null;
  createdAt: string;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string): string {
  return formatShort(iso);
}

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-400";
    case "contacted":
      return "bg-blue-500/10 text-blue-400";
    case "converted":
      return "bg-emerald-500/10 text-emerald-400";
    case "rewarded":
      return "bg-violet-500/10 text-violet-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// ── Component ────────────────────────────────────────────────

export function ReferralProgramDashboard() {
  const {
    data: programData,
    error: programError,
    isLoading: programLoading,
    mutate: mutateProgram,
  } = useSWR<{
    config: ReferralConfig;
    stats: ReferralStats;
    clientId: string;
  }>("/api/services/referral-program", fetcher);

  const { data: referralsData } = useSWR<{
    referrals: CustomerReferral[];
  }>("/api/services/referral-program/referrals", fetcher);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingReward, setEditingReward] = useState(false);
  const [rewardText, setRewardText] = useState("");

  // ── Handlers ─────────────────────────────────────────────

  function handleCopyLink() {
    if (!programData?.clientId) return;
    const link = `${window.location.origin}/referral/${programData.clientId}`;
    void navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyEmbed() {
    if (!programData?.clientId) return;
    const embedCode = `<a href="${window.location.origin}/referral/${programData.clientId}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#4c85ff;color:#fff;border-radius:8px;text-decoration:none;font-family:sans-serif;font-weight:600;">Refer a Friend</a>`;
    void navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  }

  async function handleToggleEnabled() {
    if (!programData) return;
    setSaving(true);
    try {
      await fetch("/api/services/referral-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !programData.config.enabled }),
      });
      mutateProgram();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReward() {
    if (!rewardText.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/services/referral-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardText }),
      });
      mutateProgram();
      setEditingReward(false);
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (programLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (programError) {
    return (
      <div className="flex items-center justify-center py-20" role="alert">
        <p className="text-sm text-destructive">
          Failed to load referral program data. Make sure the service is provisioned.
        </p>
      </div>
    );
  }

  const config = programData?.config || {
    enabled: false,
    rewardText: "Refer a friend and you both get $25 off!",
    rewardAmount: 2500,
    terms: "",
  };

  const stats = programData?.stats || {
    totalReferrals: 0,
    pending: 0,
    contacted: 0,
    converted: 0,
    rewarded: 0,
  };

  const referrals = referralsData?.referrals || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" aria-label="Back to dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
          <Gift className="h-5 w-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Customer Referral Program</h1>
          <p className="text-sm text-muted-foreground">
            Let your customers refer friends and earn rewards
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {stats.totalReferrals}
            </p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-400">
              {stats.converted}
            </p>
            <p className="text-xs text-muted-foreground">Conversions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {stats.rewarded}
            </p>
            <p className="text-xs text-muted-foreground">Rewards Given</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-amber-400">
              {stats.pending}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Settings className="h-4 w-4" />
              Program Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Program Status</p>
                <p className="text-xs text-muted-foreground">
                  Enable or disable the referral program
                </p>
              </div>
              <Button
                size="sm"
                variant={config.enabled ? "default" : "outline"}
                disabled={saving}
                onClick={handleToggleEnabled}
              >
                {config.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Reward</p>
                {!editingReward && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRewardText(config.rewardText);
                      setEditingReward(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {editingReward ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={rewardText}
                    onChange={(e) => setRewardText(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    aria-label="Reward text"
                  />
                  <Button size="sm" disabled={saving} onClick={handleSaveReward}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingReward(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {config.rewardText}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium">Terms</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {config.terms || "No terms configured."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share & Embed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ExternalLink className="h-4 w-4" />
              Share & Embed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Referral Page Link</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share this link with your customers
              </p>
              <div className="mt-2 flex gap-2">
                <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <code className="text-xs text-muted-foreground">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/referral/${programData?.clientId || ""}`
                      : `/referral/${programData?.clientId || ""}`}
                  </code>
                </div>
                <Button size="sm" variant="outline" onClick={handleCopyLink} aria-label={copiedLink ? "Link copied" : "Copy referral link"}>
                  {copiedLink ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">{copiedLink ? "Copied!" : "Copy link"}</span>
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Embed Code</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a referral button to your website
              </p>
              <Button
                className="mt-2 w-full"
                size="sm"
                variant="outline"
                onClick={handleCopyEmbed}
                aria-label={copiedEmbed ? "Embed code copied" : "Copy embed code"}
              >
                {copiedEmbed ? (
                  <>
                    <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-400" aria-hidden="true" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Copy Embed Code
                  </>
                )}
              </Button>
              <div aria-live="polite" className="sr-only">
                {copiedLink && "Referral link copied to clipboard"}
                {copiedEmbed && "Embed code copied to clipboard"}
              </div>
            </div>

            {programData?.clientId && (
              <div>
                <Link
                  href={`/referral/${programData.clientId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full" variant="outline" size="sm">
                    <ExternalLink className="mr-1.5 h-4 w-4" />
                    Preview Referral Page
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4" />
            Referrals ({referrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="py-8 text-center">
              <Gift className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No referrals yet. Share your referral link with customers to start earning rewards.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{referral.referrerName}</p>
                      <span className="text-sm text-muted-foreground">referred</span>
                      <p className="font-medium">
                        {referral.referredName || "—"}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Code: {referral.code}</span>
                      <span>Reward: {referral.reward}</span>
                      <span>{formatDate(referral.createdAt)}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs shrink-0 ${getStatusColor(referral.status)}`}>
                    {referral.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
