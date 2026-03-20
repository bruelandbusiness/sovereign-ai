"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  ToggleLeft,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhoneCallRecord {
  id: string;
  callSid: string;
  from: string;
  to: string;
  direction: string;
  status: string;
  duration: number | null;
  recordingUrl: string | null;
  transcription: string | null;
  sentiment: string | null;
  summary: string | null;
  leadId: string | null;
  createdAt: string;
}

interface VoiceStats {
  totalCalls: number;
  callsToday: number;
  avgDuration: number;
  leadsCaptured: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topSentiment: string;
}

interface TextbackRecord {
  id: string;
  callerPhone: string;
  textSent: boolean;
  textMessage: string;
  createdAt: string;
}

interface TextbackConfig {
  enabled: boolean;
  message: string;
  recentTextbacks: TextbackRecord[];
}

interface VoiceDashboardData {
  calls: PhoneCallRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  stats: VoiceStats;
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<VoiceDashboardData>;
  });

const textbackFetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<TextbackConfig>;
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds === 0) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  neutral: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  negative: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400",
  "in-progress": "bg-blue-500/20 text-blue-400",
  ringing: "bg-amber-500/20 text-amber-400",
  failed: "bg-red-500/20 text-red-400",
  "no-answer": "bg-zinc-500/20 text-zinc-400",
  busy: "bg-orange-500/20 text-orange-400",
};

// ---------------------------------------------------------------------------
// Transcription parser
// ---------------------------------------------------------------------------

interface TranscriptTurn {
  role: "user" | "assistant";
  content: string;
}

function parseTranscription(raw: string | null): TranscriptTurn[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TranscriptTurn[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoiceDashboardPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [callingNumber, setCallingNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);
  const [textbackMessage, setTextbackMessage] = useState("");
  const [savingTextback, setSavingTextback] = useState(false);

  // Textback config SWR
  const {
    data: textbackConfig,
    error: textbackError,
    mutate: mutateTextback,
  } = useSWR<TextbackConfig>("/api/services/voice/textback-config", textbackFetcher);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    ...(search ? { search } : {}),
  });

  const { data, isLoading, error, mutate } = useSWR<VoiceDashboardData>(
    `/api/dashboard/voice?${queryParams.toString()}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const calls = data?.calls ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    []
  );

  const handleMakeCall = useCallback(async () => {
    if (!callingNumber.trim() || isDialing) return;
    setIsDialing(true);
    try {
      const res = await fetch("/api/services/voice/outbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: callingNumber.trim() }),
      });
      if (!res.ok) throw new Error("Call failed");
      setCallingNumber("");
      await mutate();
      toast("Call initiated", "success");
    } catch {
      toast("We couldn't start the call. Please check the number and try again.", "error");
    } finally {
      setIsDialing(false);
    }
  }, [callingNumber, isDialing, mutate, toast]);

  const handleTextbackToggle = useCallback(
    async (enabled: boolean) => {
      try {
        const res = await fetch("/api/services/voice/textback-config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!res.ok) throw new Error("Toggle failed");
        await mutateTextback();
        toast(`Missed call text-back ${enabled ? "enabled" : "disabled"}`, "success");
      } catch {
        toast("We couldn't update the text-back setting. Please try again.", "error");
      }
    },
    [mutateTextback, toast]
  );

  const handleSaveTextbackMessage = useCallback(async () => {
    if (!textbackMessage.trim() || savingTextback) return;
    setSavingTextback(true);
    try {
      const res = await fetch("/api/services/voice/textback-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textbackMessage.trim() }),
      });
      if (!res.ok) throw new Error("Save failed");
      await mutateTextback();
      toast("Text-back message saved", "success");
    } catch {
      toast("We couldn't save the text-back message. Please try again.", "error");
    } finally {
      setSavingTextback(false);
    }
  }, [textbackMessage, savingTextback, mutateTextback, toast]);

  const avgDurationDisplay = useMemo(() => {
    if (!stats) return "--";
    return formatDuration(stats.avgDuration);
  }, [stats]);

  // --- Error state ---

  if (error || textbackError) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <div className="p-4 text-center">
            <p className="text-destructive font-medium">Failed to load voice dashboard data.</p>
            <p className="mt-1 text-sm text-muted-foreground">Please check your connection and try again.</p>
          </div>
        </main>
      </div>
    );
  }

  // --- Loading state ---

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="status" aria-label="Loading voice dashboard">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading voice dashboard...
          </div>
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">
              Voice Agent
            </h1>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6" role="region" aria-label="Voice agent statistics">
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <Phone className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold" aria-label={`${stats?.callsToday ?? 0} calls today`}>
                    {stats?.callsToday ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Calls Today</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <Clock className="h-5 w-5 text-amber-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold" aria-label={`Average duration: ${avgDurationDisplay}`}>{avgDurationDisplay}</p>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <Users className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold" aria-label={`${stats?.leadsCaptured ?? 0} leads captured`}>
                    {stats?.leadsCaptured ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Leads Captured
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold capitalize" aria-label={`Top sentiment: ${stats?.topSentiment ?? "neutral"}`}>
                    {stats?.topSentiment ?? "neutral"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Top Sentiment
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missed Call Text-Back */}
          <Card className="border-white/[0.06] mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <MessageSquare className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold" id="textback-label">Missed Call Text-Back</h3>
                    <p className="text-xs text-muted-foreground" id="textback-desc">
                      Automatically text callers when you miss their call
                    </p>
                  </div>
                </div>
                <Switch
                  checked={textbackConfig?.enabled ?? true}
                  onCheckedChange={handleTextbackToggle}
                  aria-labelledby="textback-label"
                  aria-describedby="textback-desc"
                />
              </div>

              {textbackConfig?.enabled !== false && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="textback-message" className="text-xs font-medium text-muted-foreground mb-1 block">
                      Message Template
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Textarea
                        id="textback-message"
                        value={
                          textbackMessage ||
                          textbackConfig?.message ||
                          "Sorry we missed your call! Reply to this text and we'll get back to you ASAP. - {businessName}"
                        }
                        onChange={(e) => setTextbackMessage(e.target.value)}
                        placeholder="Message template... Use {businessName} as a placeholder."
                        className="text-sm"
                        rows={2}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveTextbackMessage}
                        disabled={savingTextback || !textbackMessage.trim()}
                        className="shrink-0 self-end"
                        aria-busy={savingTextback}
                      >
                        {savingTextback ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          "Save Message"
                        )}
                        {savingTextback && <span className="sr-only">Saving message...</span>}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Use {"{businessName}"} to insert your business name automatically.
                    </p>
                  </div>

                  {/* Recent textbacks */}
                  {textbackConfig?.recentTextbacks && textbackConfig.recentTextbacks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Recent Text-Backs
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {textbackConfig.recentTextbacks.slice(0, 5).map((tb) => (
                          <div
                            key={tb.id}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-xs"
                          >
                            <span className="font-mono">{tb.callerPhone}</span>
                            <span className="text-muted-foreground">
                              {new Date(tb.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                tb.textSent
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : "bg-red-500/20 text-red-400 border-red-500/30"
                              }
                            >
                              {tb.textSent ? "Sent" : "Failed"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search + Make a Call */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search calls..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                aria-label="Search calls"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="+1 (555) 123-4567"
                value={callingNumber}
                onChange={(e) => setCallingNumber(e.target.value)}
                aria-label="Phone number to call"
                className="w-48"
                type="tel"
              />
              <Button
                onClick={handleMakeCall}
                disabled={!callingNumber.trim() || isDialing}
                aria-busy={isDialing}
              >
                {isDialing ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <PhoneOutgoing className="mr-1.5 h-4 w-4" aria-hidden="true" />
                )}
                {isDialing ? "Dialing..." : "Make a Call"}
              </Button>
            </div>
          </div>

          {/* Call log table */}
          <Card className="border-white/[0.06]">
            <div className="overflow-x-auto" role="region" aria-label="Call history" tabIndex={0}>
              <table className="w-full text-sm" aria-label="Call history">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs text-muted-foreground">
                    <th scope="col" className="p-3 font-medium">Date</th>
                    <th scope="col" className="p-3 font-medium">Direction</th>
                    <th scope="col" className="p-3 font-medium">From / To</th>
                    <th scope="col" className="p-3 font-medium">Duration</th>
                    <th scope="col" className="p-3 font-medium">Status</th>
                    <th scope="col" className="p-3 font-medium">Sentiment</th>
                    <th scope="col" className="p-3 font-medium">Summary</th>
                    <th scope="col" className="p-3 font-medium"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {calls.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-muted-foreground"
                      >
                        <Phone className="mx-auto mb-3 h-8 w-8 opacity-30" aria-hidden="true" />
                        <p>No calls yet</p>
                        <p className="mt-1 text-sm">Your AI voice agent is ready. Incoming and outbound calls will appear here with transcripts and sentiment analysis.</p>
                      </td>
                    </tr>
                  )}
                  {calls.map((call) => {
                    const isExpanded = expandedId === call.id;
                    const turns = parseTranscription(call.transcription);

                    return (
                      <CallRow
                        key={call.id}
                        call={call}
                        isExpanded={isExpanded}
                        turns={turns}
                        onToggle={() =>
                          setExpandedId(isExpanded ? null : call.id)
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * pagination.limit + 1} -{" "}
                {Math.min(page * pagination.limit, pagination.totalCount)} of{" "}
                {pagination.totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// CallRow sub-component
// ---------------------------------------------------------------------------

function CallRow({
  call,
  isExpanded,
  turns,
  onToggle,
}: {
  call: PhoneCallRecord;
  isExpanded: boolean;
  turns: TranscriptTurn[];
  onToggle: () => void;
}) {
  // Parse summary — might be JSON lead data if call is still in progress
  let summaryText = call.summary ?? "";
  try {
    const parsed = JSON.parse(summaryText);
    if (typeof parsed === "object" && parsed !== null && !parsed.summary) {
      summaryText = "";
    } else if (typeof parsed === "object" && parsed.summary) {
      summaryText = parsed.summary;
    }
  } catch {
    // Already a plain string
  }

  return (
    <>
      <tr
        className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`Call from ${call.direction === "inbound" ? call.from : call.to} on ${formatDate(call.createdAt)}, status: ${call.status}`}
      >
        <td className="p-3 whitespace-nowrap">{formatDate(call.createdAt)}</td>
        <td className="p-3">
          {call.direction === "inbound" ? (
            <span className="inline-flex items-center gap-1 text-blue-400">
              <PhoneIncoming className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Inbound</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-purple-400">
              <PhoneOutgoing className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Outbound</span>
            </span>
          )}
        </td>
        <td className="p-3 whitespace-nowrap font-mono text-xs">
          {call.direction === "inbound" ? call.from : call.to}
        </td>
        <td className="p-3 whitespace-nowrap">
          {formatDuration(call.duration)}
        </td>
        <td className="p-3">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[call.status] ?? "bg-zinc-500/20 text-zinc-400"}`}
            aria-label={`Call status: ${call.status}`}
          >
            {call.status}
          </span>
        </td>
        <td className="p-3">
          {call.sentiment ? (
            <Badge
              variant="outline"
              className={`text-[10px] ${SENTIMENT_COLORS[call.sentiment] ?? ""}`}
              aria-label={`Sentiment: ${call.sentiment}`}
            >
              {call.sentiment}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground" aria-label="No sentiment data">--</span>
          )}
        </td>
        <td className="p-3 max-w-[200px] truncate text-xs text-muted-foreground">
          {summaryText || "--"}
        </td>
        <td className="p-3">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="bg-white/[0.02] border-b border-white/[0.06] p-4 space-y-4">
              {/* Full summary */}
              {summaryText && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    AI Summary
                  </p>
                  <p className="text-sm">{summaryText}</p>
                </div>
              )}

              {/* Linked lead */}
              {call.leadId && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Linked Lead
                  </p>
                  <Link
                    href="/dashboard/crm"
                    className="text-sm text-primary hover:underline"
                  >
                    View in CRM
                  </Link>
                </div>
              )}

              {/* Full transcription */}
              {turns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Transcription
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg border border-white/[0.06] p-3 bg-background" role="log" aria-label="Call transcription">
                    {turns.map((turn, i) => (
                      <div
                        key={i}
                        className={`text-sm ${turn.role === "user" ? "text-blue-300" : "text-zinc-300"}`}
                      >
                        <span className="font-semibold">
                          {turn.role === "user" ? "Caller" : "AI Agent"}:
                        </span>{" "}
                        {turn.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recording */}
              {call.recordingUrl && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Recording
                  </p>
                  <audio
                    controls
                    src={call.recordingUrl}
                    className="w-full max-w-md"
                    aria-label={`Call recording from ${formatDate(call.createdAt)}`}
                  />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
