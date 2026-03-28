"use client";

import { useState, use } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Check,
  X,
  Play,
  Loader2,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-context";
import { fetcher } from "@/lib/fetcher";

const AVAILABLE_EVENTS = [
  { id: "lead.created", label: "Lead Created" },
  { id: "booking.confirmed", label: "Booking Confirmed" },
  { id: "review.received", label: "Review Received" },
];

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "lead.created": { bg: "rgba(76, 133, 255, 0.12)", text: "rgb(76, 133, 255)", border: "rgba(76, 133, 255, 0.3)" },
  "booking.confirmed": { bg: "rgba(34, 211, 161, 0.12)", text: "rgb(34, 211, 161)", border: "rgba(34, 211, 161, 0.3)" },
  "review.received": { bg: "rgba(245, 166, 35, 0.12)", text: "rgb(245, 166, 35)", border: "rgba(245, 166, 35, 0.3)" },
  "test": { bg: "rgba(255, 255, 255, 0.06)", text: "var(--muted-foreground)", border: "var(--border)" },
};

function eventStyle(eventId: string) {
  return EVENT_COLORS[eventId] ?? EVENT_COLORS["test"];
}

interface WebhookDetail {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
}

interface DeliveryLog {
  id: string;
  event: string;
  success: boolean;
  statusCode: number | null;
  payload: string | null;
  response: string | null;
  createdAt: string;
}

interface TestResultData {
  success: boolean;
  statusCode: number | null;
  response: string | null;
}

export default function WebhookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const { data: endpoints, error } = useSWR<WebhookDetail[]>("/api/dashboard/webhooks", fetcher);
  const { data: logs, isLoading: logsLoading } = useSWR<DeliveryLog[]>(
    `/api/dashboard/webhooks/${id}/logs`,
    fetcher,
  );
  const endpoint = endpoints?.find((ep) => ep.id === id);

  const [editUrl, setEditUrl] = useState("");
  const [editEvents, setEditEvents] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResultData | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  function startEditing() {
    if (!endpoint) return;
    setEditUrl(endpoint.url);
    setEditEvents([...endpoint.events]);
    setIsEditing(true);
  }

  function toggleEvent(eventId: string) {
    setEditEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editUrl, events: editEvents }),
      });
      if (res.ok) {
        setIsEditing(false);
        mutate("/api/dashboard/webhooks");
        toast("Webhook endpoint updated", "success");
      } else {
        toast("We couldn't save your changes. Please try again.", "error");
      }
    } catch {
      toast("We couldn't save your changes. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({
        success: data.success ?? false,
        statusCode: data.statusCode ?? null,
        response: data.response ?? null,
      });
      mutate("/api/dashboard/webhooks");
      mutate(`/api/dashboard/webhooks/${id}/logs`);
      if (data.success) {
        toast(`Test delivered (HTTP ${data.statusCode})`, "success");
      } else {
        toast(
          data.statusCode
            ? `Test failed with HTTP ${data.statusCode}`
            : "Test delivery failed. Check your endpoint URL.",
          "error",
        );
      }
    } catch {
      setTestResult({ success: false, statusCode: null, response: "Network error" });
      toast("We couldn't send the test event. Please check your connection.", "error");
    } finally {
      setIsTesting(false);
    }
  }

  async function handleRotateSecret() {
    if (!confirm("Rotate this webhook's signing secret? The old secret will stop working immediately.")) {
      return;
    }
    setIsRotating(true);
    setRotatedSecret(null);
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}/rotate-secret`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRotatedSecret(data.secret);
        toast("Signing secret rotated", "success");
      } else {
        toast("Could not rotate secret. Please try again.", "error");
      }
    } catch {
      toast("Could not rotate secret. Please try again.", "error");
    } finally {
      setIsRotating(false);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <div className="p-4 text-center">
            <p className="text-destructive font-medium">Failed to load webhook data.</p>
            <Link href="/dashboard/webhooks" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Webhooks
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!endpoints) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="status" aria-label="Loading webhook details">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading webhook details...
          </div>
        </main>
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Webhook endpoint not found.</p>
            <Link href="/dashboard/webhooks" className="mt-4 inline-block text-sm text-primary hover:underline">
              Back to Webhooks
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/dashboard/webhooks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Webhook Endpoint</h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting} aria-busy={isTesting}>
              {isTesting ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isTesting ? "Sending..." : "Send Test"}
            </Button>
          </div>

          {/* Test result feedback */}
          {testResult && (
            <div
              className={`mt-6 rounded-lg border p-4 text-sm ${
                testResult.success
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              }`}
              role="alert"
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span className="font-medium">
                  {testResult.success ? "Test delivered" : "Test failed"}
                  {testResult.statusCode != null && ` (HTTP ${testResult.statusCode})`}
                </span>
              </div>
              {testResult.response && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                    View response body
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-black/20 p-3 text-xs font-mono whitespace-pre-wrap break-all">
                    {testResult.response}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Configuration */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label htmlFor="edit-webhook-url" className="text-sm font-medium">URL</label>
                    <input
                      id="edit-webhook-url"
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                      pattern="https?://.*"
                      title="Please enter a valid URL starting with http:// or https://"
                    />
                  </div>
                  <fieldset>
                    <legend className="text-sm font-medium">Events</legend>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Select events">
                      {AVAILABLE_EVENTS.map((ev) => {
                        const isSelected = editEvents.includes(ev.id);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => toggleEvent(ev.id)}
                            aria-pressed={isSelected}
                            className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {isSelected && <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />}
                            {ev.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <Button onClick={handleSave} disabled={isSaving || editEvents.length === 0} aria-busy={isSaving}>
                      {isSaving ? "Saving Changes..." : "Save Changes"}
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">URL</p>
                      <code className="text-sm font-mono break-all">{endpoint.url}</code>
                    </div>
                    <Badge
                      variant={endpoint.isActive ? "default" : "secondary"}
                      aria-label={endpoint.isActive ? "Endpoint is active" : "Endpoint is paused"}
                    >
                      {endpoint.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscribed Events</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {endpoint.events.map((ev) => {
                        const colors = eventStyle(ev);
                        return (
                          <span
                            key={ev}
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {ev}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    Edit
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Signing Secret */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Signing Secret</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rotatedSecret ? (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4" role="alert">
                  <p className="text-sm font-medium text-accent">
                    New secret (copy it now, it will not be shown again):
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 break-all rounded bg-black/20 px-3 py-2 text-sm font-mono">
                      {rotatedSecret}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(rotatedSecret);
                        toast("Secret copied to clipboard", "success");
                      }}
                      aria-label="Copy new webhook secret to clipboard"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setRotatedSecret(null)}>
                    Dismiss
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Use this secret to verify webhook signatures. Each delivery includes an{" "}
                    <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs font-mono">X-Webhook-Signature</code>{" "}
                    header with an HMAC-SHA256 hex digest of the payload.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotateSecret}
                    disabled={isRotating}
                    aria-busy={isRotating}
                  >
                    {isRotating ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isRotating ? "Rotating..." : "Rotate Secret"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Delivery Logs */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div role="status" className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
                  ))}
                  <span className="sr-only">Loading delivery logs...</span>
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="space-y-2">
                  {/* Table header - hidden on mobile */}
                  <div className="hidden sm:grid sm:grid-cols-[1fr_100px_80px_40px] sm:gap-4 sm:px-3 sm:py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span>Event</span>
                    <span>Status</span>
                    <span>Time</span>
                    <span />
                  </div>
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const colors = eventStyle(log.event);
                    return (
                      <div key={log.id} className="rounded-lg border border-border">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-3 sm:grid sm:grid-cols-[1fr_100px_80px_40px] sm:gap-4 sm:items-center flex flex-col gap-2 hover:bg-muted/30 transition-colors rounded-lg"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          aria-expanded={isExpanded}
                        >
                          {/* Event */}
                          <span
                            className="inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {log.event}
                          </span>
                          {/* Status */}
                          <span
                            className="inline-flex self-start items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: log.success
                                ? "rgba(34, 197, 94, 0.12)"
                                : "rgba(239, 68, 68, 0.12)",
                              color: log.success
                                ? "rgb(34, 197, 94)"
                                : "rgb(239, 68, 68)",
                            }}
                          >
                            {log.success ? (
                              <Check className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <X className="h-3 w-3" aria-hidden="true" />
                            )}
                            {log.statusCode != null ? `${log.statusCode}` : log.success ? "OK" : "Error"}
                          </span>
                          {/* Time */}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 sm:hidden" aria-hidden="true" />
                            {new Date(log.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {/* Expand toggle */}
                          <span className="hidden sm:flex justify-end">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            )}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border px-3 py-3 space-y-3">
                            {log.payload && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Request Body</p>
                                <pre className="max-h-40 overflow-auto rounded bg-black/20 p-3 text-xs font-mono whitespace-pre-wrap break-all">
                                  {(() => {
                                    try { return JSON.stringify(JSON.parse(log.payload), null, 2); }
                                    catch { return log.payload; }
                                  })()}
                                </pre>
                              </div>
                            )}
                            {log.response && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Response Body</p>
                                <pre className="max-h-40 overflow-auto rounded bg-black/20 p-3 text-xs font-mono whitespace-pre-wrap break-all">
                                  {(() => {
                                    try { return JSON.stringify(JSON.parse(log.response), null, 2); }
                                    catch { return log.response; }
                                  })()}
                                </pre>
                              </div>
                            )}
                            {!log.payload && !log.response && (
                              <p className="text-xs text-muted-foreground">No request/response data recorded.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                    <Clock className="h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No deliveries yet. Send a test event to see results here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
