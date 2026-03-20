"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

// ── Types ────────────────────────────────────────────────────

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceType: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface ServiceConfig {
  id: string;
  serviceId: string;
  status: string;
  activatedAt: string | null;
  config: {
    businessHours?: {
      start: string;
      end: string;
    };
    allowWeekends?: boolean;
    slotDuration?: number;
    notifications?: boolean;
    [key: string]: unknown;
  };
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

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }
> = {
  confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
  completed: { label: "Completed", variant: "secondary", icon: CheckCircle2 },
  canceled: { label: "Canceled", variant: "destructive", icon: XCircle },
  no_show: { label: "No Show", variant: "destructive", icon: AlertCircle },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Component ────────────────────────────────────────────────

export function BookingDashboard() {
  const {
    data: bookings,
    error: bookingsError,
    isLoading: bookingsLoading,
  } = useSWR<Booking[]>("/api/services/booking/upcoming", fetcher);

  const {
    data: serviceConfig,
    isLoading: configLoading,
  } = useSWR<ServiceConfig>("/api/services/booking/config", fetcher);

  const [hoursStart, setHoursStart] = useState<string | null>(null);
  const [hoursEnd, setHoursEnd] = useState<string | null>(null);
  const [allowWeekends, setAllowWeekends] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const bookingList = bookings || [];

  // Derive availability settings from config or defaults
  const displayStart =
    hoursStart ?? serviceConfig?.config?.businessHours?.start ?? "09:00";
  const displayEnd =
    hoursEnd ?? serviceConfig?.config?.businessHours?.end ?? "17:00";
  const displayWeekends =
    allowWeekends ?? serviceConfig?.config?.allowWeekends ?? false;

  // Stats
  const now = new Date();
  const thisMonth = bookingList.filter((b) => {
    const d = new Date(b.startsAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const bookingsThisMonth = thisMonth.length;
  const noShowCount = bookingList.filter((b) => b.status === "no_show").length;
  const noShowRate =
    bookingList.length > 0
      ? `${((noShowCount / bookingList.length) * 100).toFixed(1)}%`
      : "0%";

  // Most popular time slot
  const hourCounts: Record<number, number> = {};
  bookingList.forEach((b) => {
    const hour = new Date(b.startsAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const popularHour = Object.entries(hourCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const popularTimeSlot = popularHour
    ? `${parseInt(popularHour[0]) % 12 || 12}:00 ${parseInt(popularHour[0]) >= 12 ? "PM" : "AM"}`
    : "--";

  const hasChanges =
    hoursStart !== null || hoursEnd !== null || allowWeekends !== null;

  async function handleSaveAvailability() {
    setIsSaving(true);
    try {
      await fetch("/api/services/booking/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessHours: {
            start: displayStart,
            end: displayEnd,
          },
          allowWeekends: displayWeekends,
        }),
      });
      setHoursStart(null);
      setHoursEnd(null);
      setAllowWeekends(null);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────

  if (bookingsLoading && configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading booking system...
        </span>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load bookings. Make sure the booking service is provisioned.
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
          <Button variant="ghost" size="icon-sm" aria-hidden="true" tabIndex={-1}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10" aria-hidden="true">
          <Calendar className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">AI Scheduling System</h1>
          <p className="text-sm text-muted-foreground">
            Smart scheduling that fills your calendar automatically
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant="default">Active</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
              <BarChart3 className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {bookingsThisMonth}
              </p>
              <p className="text-xs text-muted-foreground">
                Bookings This Month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{noShowRate}</p>
              <p className="text-xs text-muted-foreground">No-Show Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {popularTimeSlot}
              </p>
              <p className="text-xs text-muted-foreground">
                Most Popular Slot
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Bookings ({bookingList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingList.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No upcoming bookings. Appointments will appear here as
                    customers schedule with you.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {bookingList.map((booking) => {
                    const statusConfig =
                      STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={booking.id}
                        className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {booking.customerName}
                            </p>
                            <Badge variant={statusConfig.variant}>
                              <StatusIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {formatDateTime(booking.startsAt)} -{" "}
                              {formatTime(booking.endsAt)}
                            </span>
                            {booking.serviceType && (
                              <span className="flex items-center gap-1">
                                | {booking.serviceType}
                              </span>
                            )}
                            {booking.customerPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {booking.customerPhone}
                              </span>
                            )}
                            {booking.customerEmail && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {booking.customerEmail}
                              </span>
                            )}
                          </div>
                          {booking.notes && (
                            <p className="mt-1 text-xs text-muted-foreground/70">
                              {booking.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Availability Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="hours-start">Business Hours Start</Label>
                <Input
                  id="hours-start"
                  type="time"
                  value={displayStart}
                  onChange={(e) => setHoursStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours-end">Business Hours End</Label>
                <Input
                  id="hours-end"
                  type="time"
                  value={displayEnd}
                  onChange={(e) => setHoursEnd(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-weekends">Allow Weekend Bookings</Label>
                <Switch
                  id="allow-weekends"
                  checked={displayWeekends}
                  onCheckedChange={(checked) => setAllowWeekends(checked)}
                />
              </div>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={handleSaveAvailability}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? "Saving..." : "Save Availability"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
