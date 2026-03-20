"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  Copy,
  CheckCircle2,
  Settings,
  Eye,
  Loader2,
  Star,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ────────────────────────────────────────────────────

interface SocialProofConfig {
  enabled: boolean;
  style: string;
  position: string;
  frequency: number;
  showBookings: boolean;
  showReviews: boolean;
  showLeads: boolean;
  maxPerVisit: number;
}

interface FeedEvent {
  type: "booking" | "review" | "lead";
  title: string;
  subtitle: string;
  rating?: number;
  timestamp: string;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Component ────────────────────────────────────────────────

export default function SocialProofDashboard() {
  const {
    data: configData,
    isLoading: configLoading,
    error: configError,
    mutate: mutateConfig,
  } = useSWR<{ config: SocialProofConfig; clientId: string }>(
    "/api/services/social-proof/config",
    fetcher
  );

  const { data: feedData, error: feedError } = useSWR<{ events: FeedEvent[] }>(
    configData?.clientId
      ? `/api/services/social-proof/feed?clientId=${configData.clientId}`
      : null,
    fetcher
  );

  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Handlers ─────────────────────────────────────────────

  function handleCopyEmbed() {
    if (!configData?.clientId) return;
    const embedCode = `<script src="${window.location.origin}/embed/social-proof.js" data-client-id="${configData.clientId}" data-position="${configData.config.position}" data-style="${configData.config.style}" data-max="${configData.config.maxPerVisit}" defer></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  }

  async function handleToggle(key: string, value: boolean) {
    setSaving(true);
    try {
      await fetch("/api/services/social-proof/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      mutateConfig();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePosition(position: string) {
    setSaving(true);
    try {
      await fetch("/api/services/social-proof/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      mutateConfig();
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (configError || feedError) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          Failed to load social proof data. Please try refreshing the page.
        </div>
      </div>
    );
  }

  const config = configData?.config || {
    enabled: true,
    style: "toast",
    position: "bottom-left",
    frequency: 20000,
    showBookings: true,
    showReviews: true,
    showLeads: true,
    maxPerVisit: 5,
  };

  const events = feedData?.events || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon-sm" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
          <Zap className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Social Proof Widget</h1>
          <p className="text-sm text-muted-foreground">
            Show real-time activity notifications on your website
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Widget Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Eye className="h-4 w-4" />
              Widget Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative min-h-[200px] rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="text-center text-xs text-muted-foreground">
                Your Website
              </p>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="rounded-xl border border-border bg-background p-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Sarah from Austin just booked a service
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 minutes ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Embed Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Copy className="h-4 w-4" />
              Embed Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Add this script to your website, just before the closing{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                &lt;/body&gt;
              </code>{" "}
              tag.
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <code className="block whitespace-pre-wrap text-xs text-muted-foreground">
                {`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/social-proof.js" data-client-id="${configData?.clientId || "YOUR_CLIENT_ID"}" data-position="${config.position}" data-style="${config.style}" data-max="${config.maxPerVisit}" defer></script>`}
              </code>
            </div>
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={handleCopyEmbed}
            >
              {copiedEmbed ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy Embed Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Settings className="h-4 w-4" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Widget Enabled</p>
                <p className="text-xs text-muted-foreground">
                  Show social proof notifications on your website
                </p>
              </div>
              <Button
                size="sm"
                variant={config.enabled ? "default" : "outline"}
                disabled={saving}
                onClick={() => handleToggle("enabled", !config.enabled)}
                aria-pressed={config.enabled}
                aria-label={config.enabled ? "Widget enabled, click to disable" : "Widget disabled, click to enable"}
              >
                {config.enabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {/* Position */}
            <div>
              <p className="mb-2 text-sm font-medium" id="sov-sp-position-label">Position</p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="sov-sp-position-label">
                {["bottom-left", "bottom-right", "top-left", "top-right"].map(
                  (pos) => (
                    <Button
                      key={pos}
                      size="sm"
                      variant={config.position === pos ? "default" : "outline"}
                      disabled={saving}
                      onClick={() => handleUpdatePosition(pos)}
                      aria-pressed={config.position === pos}
                    >
                      {pos.replace("-", " ")}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Event Types */}
            <div>
              <p className="mb-2 text-sm font-medium">Events to Show</p>
              <div className="space-y-2">
                {[
                  { key: "showBookings", label: "Recent Bookings", icon: Calendar },
                  { key: "showReviews", label: "New Reviews", icon: Star },
                  { key: "showLeads", label: "Lead Activity", icon: MessageSquare },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={
                        config[item.key as keyof SocialProofConfig]
                          ? "default"
                          : "outline"
                      }
                      disabled={saving}
                      onClick={() =>
                        handleToggle(
                          item.key,
                          !config[item.key as keyof SocialProofConfig]
                        )
                      }
                      aria-pressed={!!config[item.key as keyof SocialProofConfig]}
                      aria-label={item.label + (config[item.key as keyof SocialProofConfig] ? " is on, click to turn off" : " is off, click to turn on")}
                    >
                      {config[item.key as keyof SocialProofConfig]
                        ? "On"
                        : "Off"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Zap className="h-4 w-4" />
            Recent Activity Feed ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      event.type === "booking"
                        ? "bg-blue-500/10 text-blue-400"
                        : event.type === "review"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {event.type === "booking" ? (
                      <Calendar className="h-3.5 w-3.5" />
                    ) : event.type === "review" ? (
                      <Star className="h-3.5 w-3.5" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.subtitle}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
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
