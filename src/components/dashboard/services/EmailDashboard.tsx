"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatShort } from "@/lib/date-utils";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Plus,
  Sparkles,
  Send,
  Eye,
  MousePointer,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { formatPercentValue } from "@/lib/formatters";

// ── Types ────────────────────────────────────────────────────

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  status: string;
  recipients: number;
  opens: number;
  clicks: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  active: "default",
  paused: "secondary",
  completed: "secondary",
};

const TYPE_LABELS: Record<string, string> = {
  drip: "Drip Sequence",
  broadcast: "Broadcast",
  reengagement: "Re-engagement",
};

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return formatShort(iso);
}

function openRate(opens: number, recipients: number): string {
  if (recipients === 0) return "--";
  return formatPercentValue((opens / recipients) * 100);
}

function clickRate(clicks: number, recipients: number): string {
  if (recipients === 0) return "--";
  return formatPercentValue((clicks / recipients) * 100);
}

// ── Component ────────────────────────────────────────────────

export function EmailDashboard() {
  const {
    data: campaigns,
    error,
    isLoading,
    mutate,
  } = useSWR<EmailCampaign[]>("/api/services/email/campaigns", fetcher);

  const [showForm, setShowForm] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const campaignList = campaigns || [];

  // Stats
  const totalCampaigns = campaignList.length;
  const totalRecipients = campaignList.reduce((sum, c) => sum + c.recipients, 0);
  const totalOpens = campaignList.reduce((sum, c) => sum + c.opens, 0);
  const totalClicks = campaignList.reduce((sum, c) => sum + c.clicks, 0);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignName.trim() || !campaignSubject.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/services/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName.trim(),
          subject: campaignSubject.trim(),
        }),
      });

      if (res.ok) {
        setCampaignName("");
        setCampaignSubject("");
        setShowForm(false);
        mutate();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateCampaign() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/services/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "broadcast" }),
      });

      if (res.ok) {
        mutate();
      }
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Loading / Error states ─────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading email campaigns...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load email campaigns. Make sure the email service is
          provisioned.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" aria-label="Back to dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
          <Mail className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">AI Email Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Automated campaigns that nurture leads and drive repeat business
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCampaign}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Generate Campaign
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
              <Send className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalCampaigns}</p>
              <p className="text-xs text-muted-foreground">Campaigns</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalRecipients}</p>
              <p className="text-xs text-muted-foreground">Recipients</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Eye className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {openRate(totalOpens, totalRecipients)}
              </p>
              <p className="text-xs text-muted-foreground">Open Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <MousePointer className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {clickRate(totalClicks, totalRecipients)}
              </p>
              <p className="text-xs text-muted-foreground">Click Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Campaign Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Create Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g. Spring Promotion"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-subject">Email Subject</Label>
                  <Input
                    id="campaign-subject"
                    placeholder="e.g. Exclusive Spring Savings Inside!"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    required
                  />
                </div>
              </div>
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

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns ({campaignList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignList.length === 0 ? (
            <div className="py-12 text-center">
              <Mail className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No campaigns yet. Create your first campaign or let AI generate
                one for you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaignList.map((campaign) => {
                const isExpanded = expandedId === campaign.id;

                return (
                  <div
                    key={campaign.id}
                    className="rounded-lg border border-border/50 bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {campaign.name}
                          </p>
                          <Badge
                            variant={
                              STATUS_BADGE_VARIANT[campaign.status] || "outline"
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">
                            {TYPE_LABELS[campaign.type] || campaign.type}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Subject: {campaign.subject}</span>
                          <span className="text-border">|</span>
                          <span>{campaign.recipients} recipients</span>
                          <span className="text-border">|</span>
                          <span>
                            {openRate(campaign.opens, campaign.recipients)} open
                          </span>
                          <span className="text-border">|</span>
                          <span>
                            {clickRate(campaign.clicks, campaign.recipients)}{" "}
                            click
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(campaign.sentAt || campaign.createdAt)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : campaign.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded preview */}
                    {isExpanded && (
                      <div className="border-t border-border/50 px-4 py-4">
                        <div className="rounded-lg border border-border bg-background p-4">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Email Preview
                          </p>
                          <div
                            className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(campaign.body) }}
                          />
                        </div>
                        {campaign.sentAt && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Sent on {formatDate(campaign.sentAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
