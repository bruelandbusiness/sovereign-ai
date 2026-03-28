"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Code,
  Palette,
  Eye,
  Clock,
  Settings,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface ServiceType {
  name: string;
  duration: number;
  price: number;
  enabled: boolean;
}

// ── Component ────────────────────────────────────────────────

export default function BookingWidgetPage() {
  const { user } = useSession();
  const clientId = user?.client?.id || "YOUR_CLIENT_ID";
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://app.sovereign-ai.com";

  const [copied, setCopied] = useState(false);
  const [buttonText, setButtonText] = useState("Book Now");
  const [color, setColor] = useState("#4c85ff");
  const [position, setPosition] = useState<"left" | "right">("right");

  // Business hours configuration
  const [hoursStart, setHoursStart] = useState("07:00");
  const [hoursEnd, setHoursEnd] = useState("18:00");
  const [allowWeekends, setAllowWeekends] = useState(false);
  const [bufferTime, setBufferTime] = useState("15");
  const [autoConfirm, setAutoConfirm] = useState(true);

  // Service types with duration and pricing
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([
    { name: "AC Repair", duration: 90, price: 150, enabled: true },
    { name: "Furnace Tune-Up", duration: 60, price: 120, enabled: true },
    { name: "Plumbing Inspection", duration: 60, price: 200, enabled: true },
    { name: "Drain Cleaning", duration: 60, price: 180, enabled: true },
    { name: "Water Heater Install", duration: 120, price: 450, enabled: true },
    { name: "Roof Inspection", duration: 90, price: 250, enabled: false },
    { name: "Gutter Cleaning", duration: 60, price: 150, enabled: false },
    { name: "Electrical Panel Upgrade", duration: 180, price: 500, enabled: false },
  ]);

  const embedCode = `<script src="${appUrl}/embed/booking.js" data-client-id="${clientId}" data-button-text="${buttonText}" data-color="${color}" data-position="${position}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleService = (index: number) => {
    setServiceTypes((prev) =>
      prev.map((svc, i) =>
        i === index ? { ...svc, enabled: !svc.enabled } : svc
      )
    );
  };

  const updateServiceField = (
    index: number,
    field: keyof ServiceType,
    value: string | number
  ) => {
    setServiceTypes((prev) =>
      prev.map((svc, i) => (i === index ? { ...svc, [field]: value } : svc))
    );
  };

  const enabledServices = serviceTypes.filter((s) => s.enabled);

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard/services/booking">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Booking Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">
              Booking Widget Setup
            </h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column: Configuration */}
            <div className="space-y-6">
              {/* Widget Appearance */}
              <Card className="border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Widget Appearance</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sov-cfg-btn-text">Button Text</Label>
                      <Input
                        id="sov-cfg-btn-text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Book Now"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sov-cfg-color-hex">Primary Color</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="h-10 w-16 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer"
                          aria-label="Pick primary color"
                        />
                        <Input
                          id="sov-cfg-color-hex"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          placeholder="#4c85ff"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label id="sov-cfg-position-label">Position</Label>
                      <div
                        className="flex gap-2 mt-1"
                        role="group"
                        aria-labelledby="sov-cfg-position-label"
                      >
                        {(["left", "right"] as const).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setPosition(pos)}
                            aria-pressed={position === pos}
                            className={cn(
                              "rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors",
                              position === pos
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-white/[0.06] text-muted-foreground hover:border-white/20"
                            )}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Hours Configuration */}
              <Card className="border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Available Hours</h2>
                  </div>

                  {/* Business hours grid */}
                  <div className="rounded-lg border border-border bg-muted/20 p-4 mb-4">
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day, idx) => (
                          <div key={day} className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground">
                              {day}
                            </p>
                            <div
                              className={cn(
                                "rounded-md py-2 text-[10px] font-medium",
                                idx < 5
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : allowWeekends
                                    ? "bg-emerald-500/10 text-emerald-400/70"
                                    : "bg-muted text-muted-foreground/40"
                              )}
                            >
                              {idx < 5 || allowWeekends ? (
                                <span>
                                  {hoursStart}
                                  <br />
                                  {hoursEnd}
                                </span>
                              ) : (
                                "Closed"
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="widget-hours-start">Opens At</Label>
                        <Input
                          id="widget-hours-start"
                          type="time"
                          value={hoursStart}
                          onChange={(e) => setHoursStart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="widget-hours-end">Closes At</Label>
                        <Input
                          id="widget-hours-end"
                          type="time"
                          value={hoursEnd}
                          onChange={(e) => setHoursEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="widget-weekends">Weekend Bookings</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Accept bookings on Sat/Sun
                        </p>
                      </div>
                      <Switch
                        id="widget-weekends"
                        checked={allowWeekends}
                        onCheckedChange={setAllowWeekends}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Types */}
              <Card className="border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Service Types</h2>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    Configure which services customers can book, with duration
                    and pricing.
                  </p>

                  <div className="space-y-3">
                    {serviceTypes.map((svc, idx) => (
                      <div
                        key={svc.name}
                        className={cn(
                          "rounded-lg border p-3 transition-colors",
                          svc.enabled
                            ? "border-border bg-card"
                            : "border-border/40 bg-muted/20 opacity-60"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`svc-toggle-${idx}`}
                              checked={svc.enabled}
                              onCheckedChange={() => toggleService(idx)}
                              aria-label={`Enable ${svc.name}`}
                            />
                            <Label
                              htmlFor={`svc-toggle-${idx}`}
                              className={cn(
                                "text-sm font-medium",
                                !svc.enabled && "text-muted-foreground"
                              )}
                            >
                              {svc.name}
                            </Label>
                          </div>
                        </div>

                        {svc.enabled && (
                          <div className="grid grid-cols-2 gap-3 ml-10">
                            <div className="space-y-1">
                              <Label
                                htmlFor={`svc-dur-${idx}`}
                                className="text-[11px] text-muted-foreground"
                              >
                                Duration (min)
                              </Label>
                              <Input
                                id={`svc-dur-${idx}`}
                                type="number"
                                min={15}
                                step={15}
                                value={svc.duration}
                                onChange={(e) =>
                                  updateServiceField(
                                    idx,
                                    "duration",
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label
                                htmlFor={`svc-price-${idx}`}
                                className="text-[11px] text-muted-foreground"
                              >
                                Price ($)
                              </Label>
                              <Input
                                id={`svc-price-${idx}`}
                                type="number"
                                min={0}
                                value={svc.price}
                                onChange={(e) =>
                                  updateServiceField(
                                    idx,
                                    "price",
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Scheduling Settings */}
              <Card className="border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Scheduling Options</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="widget-buffer">
                        Buffer Time Between Appointments
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Prevent back-to-back scheduling to allow travel or prep
                        time
                      </p>
                      <select
                        id="widget-buffer"
                        value={bufferTime}
                        onChange={(e) => setBufferTime(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="0">No buffer</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="widget-auto-confirm">
                          Auto-Confirm Bookings
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Instantly confirm without requiring manual approval
                        </p>
                      </div>
                      <Switch
                        id="widget-auto-confirm"
                        checked={autoConfirm}
                        onCheckedChange={setAutoConfirm}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Embed Code */}
              <Card className="border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Embed Code</h2>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    Add this code to your website, just before the closing{" "}
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs">
                      &lt;/body&gt;
                    </code>{" "}
                    tag.
                  </p>

                  <div className="relative">
                    <pre className="rounded-lg bg-black/40 border border-white/[0.06] p-4 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all">
                      {embedCode}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={handleCopy}
                      aria-label={
                        copied ? "Copied to clipboard" : "Copy embed code"
                      }
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Preview */}
            <div>
              <Card className="border-white/[0.06] sticky top-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Widget Preview</h2>
                  </div>

                  <div className="relative rounded-lg border border-white/[0.06] bg-card h-[600px] overflow-hidden">
                    {/* Mock website content */}
                    <div className="p-6 space-y-4">
                      <div className="h-8 w-40 rounded bg-white/[0.06]" />
                      <div className="h-4 w-full rounded bg-white/[0.04]" />
                      <div className="h-4 w-3/4 rounded bg-white/[0.04]" />
                      <div className="h-4 w-5/6 rounded bg-white/[0.04]" />
                    </div>

                    {/* Expanded booking widget preview */}
                    <div className="absolute inset-x-4 top-32 rounded-xl border border-white/[0.08] bg-card shadow-xl p-5">
                      <div className="text-center mb-4">
                        <div
                          className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Calendar
                            className="h-5 w-5"
                            style={{ color }}
                          />
                        </div>
                        <h3 className="font-semibold text-sm">
                          Schedule Your Service
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Pick a service and choose your preferred time
                        </p>
                      </div>

                      {/* Service selection */}
                      <div className="space-y-1.5 mb-4">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          Select Service
                        </p>
                        {enabledServices.slice(0, 4).map((svc, idx) => (
                          <div
                            key={svc.name}
                            className={cn(
                              "flex items-center justify-between rounded-md border px-3 py-2 text-xs",
                              idx === 0
                                ? "border-primary/40 bg-primary/5"
                                : "border-border"
                            )}
                            style={
                              idx === 0
                                ? {
                                    borderColor: `${color}60`,
                                    backgroundColor: `${color}08`,
                                  }
                                : undefined
                            }
                          >
                            <div>
                              <span className="font-medium">{svc.name}</span>
                              <span className="ml-2 text-muted-foreground">
                                {svc.duration} min
                              </span>
                            </div>
                            <span
                              className="font-semibold"
                              style={idx === 0 ? { color } : undefined}
                            >
                              ${svc.price}
                            </span>
                          </div>
                        ))}
                        {enabledServices.length > 4 && (
                          <p className="text-center text-[10px] text-muted-foreground">
                            +{enabledServices.length - 4} more services
                          </p>
                        )}
                      </div>

                      {/* Time slots */}
                      <div className="mb-4">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          Available Times
                        </p>
                        <div className="grid grid-cols-4 gap-1">
                          {["9:00", "10:00", "11:00", "1:00", "2:00", "3:00", "4:00", "5:00"].map(
                            (time, idx) => (
                              <div
                                key={time}
                                className={cn(
                                  "rounded-md border px-1.5 py-1 text-center text-[10px] font-medium",
                                  idx === 1
                                    ? "text-white"
                                    : idx === 4
                                      ? "border-border/40 text-muted-foreground/30 line-through"
                                      : "border-border text-muted-foreground"
                                )}
                                style={
                                  idx === 1
                                    ? { backgroundColor: color, borderColor: color }
                                    : undefined
                                }
                              >
                                {time}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: color }}
                        type="button"
                      >
                        {buttonText}
                      </button>

                      {bufferTime !== "0" && (
                        <p className="text-center text-[9px] text-muted-foreground mt-2">
                          {bufferTime} min buffer between appointments
                        </p>
                      )}
                    </div>

                    {/* Floating button */}
                    <div
                      className="absolute bottom-4 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg cursor-pointer"
                      style={{
                        backgroundColor: color,
                        [position]: "16px",
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                      {buttonText}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      The widget shows your services, pricing, and available
                      time slots
                    </p>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                      <span>
                        {enabledServices.length} services enabled
                      </span>
                      <span>|</span>
                      <span>
                        {hoursStart} - {hoursEnd}
                      </span>
                      <span>|</span>
                      <span>
                        {autoConfirm ? "Auto-confirm on" : "Manual confirm"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
