"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Bell,
  Mail,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getServiceById } from "@/lib/constants";

// ── Types ────────────────────────────────────────────────────

interface ServiceConfig {
  id: string;
  serviceId: string;
  status: string;
  activatedAt: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Component ────────────────────────────────────────────────

export function ManagedServiceDashboard({ serviceId }: { serviceId: string }) {
  const service = getServiceById(serviceId);

  const {
    data: serviceConfig,
    error: configError,
    isLoading: configLoading,
  } = useSWR<ServiceConfig>(`/api/services/${serviceId}/config`, fetcher);

  const {
    data: activity,
    error: activityError,
    isLoading: activityLoading,
  } = useSWR<ActivityEvent[]>(`/api/services/${serviceId}/activity`, fetcher);

  const [notes, setNotes] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!service) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">Service not found.</p>
      </div>
    );
  }

  const Icon = service.icon;

  // Derive displayed values
  const displayNotes =
    notes ?? (serviceConfig?.config?.notes as string) ?? "";
  const displayNotifications =
    notifications ??
    (serviceConfig?.config?.notifications as boolean) ??
    true;

  async function handleSavePreferences() {
    setIsSaving(true);
    try {
      await fetch(`/api/services/${serviceId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: displayNotes,
          notifications: displayNotifications,
        }),
      });
      await mutate(`/api/services/${serviceId}/config`);
      setNotes(null);
      setNotifications(null);
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges =
    notes !== null || notifications !== null;

  // ── Loading / Error states ─────────────────────────────────

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading {service.name}...
        </span>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load service configuration. Make sure the service is
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
        <Link href="/dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${service.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{service.name}</h1>
          <p className="text-sm text-muted-foreground">{service.tagline}</p>
        </div>
        <div className="ml-auto">
          <Badge
            variant={
              serviceConfig?.status === "active" ? "default" : "secondary"
            }
          >
            {serviceConfig?.status === "active" ? "Active" : serviceConfig?.status || "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Managed by Your Dedicated Team
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your Sovereign AI team actively manages this service. All
                  optimizations, updates, and strategy adjustments are handled
                  for you.
                </p>
              </div>
            </div>
            {serviceConfig?.activatedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Activated on{" "}
                  {new Date(serviceConfig.activatedAt).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Included Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {service.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-sm text-muted-foreground">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="service-notifications">
                Email Notifications
              </Label>
              <Switch
                id="service-notifications"
                checked={displayNotifications}
                onCheckedChange={(checked) => setNotifications(checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-notes">Notes & Preferences</Label>
              <Textarea
                id="service-notes"
                value={displayNotes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any specific notes, preferences, or instructions for your team..."
              />
            </div>
            {hasChanges && (
              <Button
                size="sm"
                onClick={handleSavePreferences}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Preferences"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Need Changes?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Want to adjust your {service.name.toLowerCase()} strategy, update
              targeting, or request specific changes? Your dedicated account
              manager is here to help.
            </p>
            <a href="mailto:support@sovereign-ai.com">
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Contact Account Manager
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading activity...
              </span>
            </div>
          )}

          {activityError && (
            <p className="py-8 text-center text-sm text-destructive">
              Failed to load activity.
            </p>
          )}

          {!activityLoading && !activityError && activity && activity.length === 0 && (
            <div className="py-12 text-center">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No activity yet. Events will appear here as your service runs.
              </p>
            </div>
          )}

          {!activityLoading && !activityError && activity && activity.length > 0 && (
            <div className="divide-y divide-border">
              {activity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
