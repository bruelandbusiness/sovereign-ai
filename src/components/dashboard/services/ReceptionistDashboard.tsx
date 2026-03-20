"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Phone,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  Settings,
  PhoneCall,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReceptionistConfig {
  id: string;
  isActive: boolean;
  greeting: string;
  businessName: string;
  businessHours: string | null;
  afterHoursMsg: string;
  emergencyKeywords: string[];
  emergencyAction: string;
  emergencyPhone: string | null;
  voiceId: string;
  maxCallMinutes: number;
  collectInfo: string[];
  canBookJobs: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CallLogRecord {
  id: string;
  callerPhone: string;
  callerName: string | null;
  duration: number;
  status: string;
  sentiment: string | null;
  summary: string | null;
  transcript: string | null;
  isEmergency: boolean;
  bookingCreated: boolean;
  bookingId: string | null;
  leadCreated: boolean;
  leadId: string | null;
  recordingUrl: string | null;
  createdAt: string;
}

interface CallsResponse {
  calls: CallLogRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface ReceptionistStats {
  callsToday: number;
  totalCalls: number;
  avgDuration: number;
  jobsBooked: number;
  emergencyCalls: number;
  leadsCreated: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

const fetcher = <T,>(url: string): Promise<T> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<T>;
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  if (seconds === 0) return "--";
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

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  neutral: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  negative: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400",
  missed: "bg-red-500/20 text-red-400",
  transferred: "bg-amber-500/20 text-amber-400",
  voicemail: "bg-blue-500/20 text-blue-400",
};

const VOICE_OPTIONS = [
  { id: "alloy", label: "Alloy (Female)" },
  { id: "echo", label: "Echo (Male)" },
  { id: "fable", label: "Fable (Female)" },
  { id: "onyx", label: "Onyx (Male)" },
  { id: "nova", label: "Nova (Female)" },
  { id: "shimmer", label: "Shimmer (Female)" },
];

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

export function ReceptionistDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Config
  const {
    data: config,
    error: configError,
    isLoading: configLoading,
  } = useSWR<ReceptionistConfig>(
    "/api/services/receptionist/config",
    (url: string) => fetcher<ReceptionistConfig>(url)
  );

  // Stats
  const { data: stats } = useSWR<ReceptionistStats>(
    "/api/services/receptionist/stats",
    (url: string) => fetcher<ReceptionistStats>(url),
    { refreshInterval: 30000 }
  );

  // Calls
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    ...(search ? { search } : {}),
  });

  const {
    data: callsData,
    isLoading: callsLoading,
  } = useSWR<CallsResponse>(
    `/api/services/receptionist/calls?${queryParams.toString()}`,
    (url: string) => fetcher<CallsResponse>(url),
    { refreshInterval: 30000 }
  );

  const calls = callsData?.calls ?? [];
  const pagination = callsData?.pagination;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const avgDurationDisplay = useMemo(() => {
    if (!stats) return "--";
    return formatDuration(stats.avgDuration);
  }, [stats]);

  // --- Loading / Error states ---

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <p className="text-sm text-muted-foreground">
          Loading AI Receptionist...
        </p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load AI Receptionist configuration. Make sure the service is
          provisioned.
        </p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">AI Receptionist</h1>
          <p className="text-sm text-muted-foreground">
            24/7 AI-powered phone answering &amp; job booking
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant={config.isActive ? "default" : "secondary"}>
            {config.isActive ? "Active" : "Inactive"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig((s) => !s)}
          >
            <Settings className="mr-1.5 h-4 w-4" />
            {showConfig ? "Hide Settings" : "Settings"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-white/[0.06]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Phone className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.callsToday ?? 0}</p>
              <p className="text-xs text-muted-foreground">Calls Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgDurationDisplay}</p>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.jobsBooked ?? 0}</p>
              <p className="text-xs text-muted-foreground">Jobs Booked</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats?.emergencyCalls ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Emergency Calls</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel (collapsible) */}
      {showConfig && <ConfigPanel config={config} />}

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search calls..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            aria-label="Search calls by name or phone number"
          />
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{stats?.leadsCreated ?? 0} leads captured</span>
        </div>
      </div>

      {/* Call Log Table */}
      <Card className="border-white/[0.06]">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Call log table">
          <table className="w-full text-sm" aria-label="Call log">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium" scope="col">Time</th>
                <th className="p-3 font-medium" scope="col">Caller</th>
                <th className="p-3 font-medium" scope="col">Duration</th>
                <th className="p-3 font-medium" scope="col">Status</th>
                <th className="p-3 font-medium" scope="col">Sentiment</th>
                <th className="p-3 font-medium" scope="col">Summary</th>
                <th className="p-3 font-medium" scope="col">Booking</th>
                <th className="p-3 font-medium" scope="col"><span className="sr-only">Expand</span></th>
              </tr>
            </thead>
            <tbody>
              {callsLoading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              )}
              {!callsLoading && calls.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground"
                  >
                    <PhoneCall className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
                    <p>
                      No calls yet. Your AI Receptionist is ready to receive
                      calls.
                    </p>
                  </td>
                </tr>
              )}
              {calls.map((call) => {
                const isExpanded = expandedId === call.id;
                const turns = parseTranscription(call.transcript);

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
        <div className="flex items-center justify-between">
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfigPanel sub-component
// ---------------------------------------------------------------------------

function ConfigPanel({ config }: { config: ReceptionistConfig }) {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [afterHoursMsg, setAfterHoursMsg] = useState<string | null>(null);
  const [emergencyPhone, setEmergencyPhone] = useState<string | null>(null);
  const [emergencyKeywords, setEmergencyKeywords] = useState<string | null>(
    null
  );
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const displayGreeting = greeting ?? config.greeting;
  const displayAfterHours = afterHoursMsg ?? config.afterHoursMsg;
  const displayEmergencyPhone = emergencyPhone ?? config.emergencyPhone ?? "";
  const displayEmergencyKeywords =
    emergencyKeywords ?? config.emergencyKeywords.join(", ");
  const displayVoiceId = voiceId ?? config.voiceId;

  async function handleSave() {
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (greeting !== null) body.greeting = greeting;
      if (afterHoursMsg !== null) body.afterHoursMsg = afterHoursMsg;
      if (emergencyPhone !== null)
        body.emergencyPhone = emergencyPhone || null;
      if (emergencyKeywords !== null)
        body.emergencyKeywords = emergencyKeywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      if (voiceId !== null) body.voiceId = voiceId;

      if (Object.keys(body).length === 0) return;

      await fetch("/api/services/receptionist/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await globalMutate("/api/services/receptionist/config");

      // Reset local state
      setGreeting(null);
      setAfterHoursMsg(null);
      setEmergencyPhone(null);
      setEmergencyKeywords(null);
      setVoiceId(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive() {
    await fetch("/api/services/receptionist/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !config.isActive }),
    });
    await globalMutate("/api/services/receptionist/config");
  }

  async function handleToggleBooking() {
    await fetch("/api/services/receptionist/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canBookJobs: !config.canBookJobs }),
    });
    await globalMutate("/api/services/receptionist/config");
  }

  const hasChanges =
    greeting !== null ||
    afterHoursMsg !== null ||
    emergencyPhone !== null ||
    emergencyKeywords !== null ||
    voiceId !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="receptionist-active">Receptionist Active</Label>
            <Switch
              id="receptionist-active"
              checked={config.isActive}
              onCheckedChange={handleToggleActive}
            />
          </div>

          {/* Can Book Jobs Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="receptionist-booking">Auto-Book Jobs</Label>
            <Switch
              id="receptionist-booking"
              checked={config.canBookJobs}
              onCheckedChange={handleToggleBooking}
            />
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <Label htmlFor="receptionist-greeting">Greeting Message</Label>
            <Textarea
              id="receptionist-greeting"
              value={displayGreeting}
              onChange={(e) => setGreeting(e.target.value)}
              rows={3}
              placeholder="Enter a greeting message..."
            />
          </div>

          {/* After-Hours Message */}
          <div className="space-y-2">
            <Label htmlFor="receptionist-afterhours">
              After-Hours Message
            </Label>
            <Textarea
              id="receptionist-afterhours"
              value={displayAfterHours}
              onChange={(e) => setAfterHoursMsg(e.target.value)}
              rows={2}
              placeholder="Message for calls outside business hours..."
            />
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label htmlFor="receptionist-voice">Voice</Label>
            <select
              id="receptionist-voice"
              value={displayVoiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Emergency Keywords */}
          <div className="space-y-2">
            <Label htmlFor="receptionist-keywords">
              Emergency Keywords (comma-separated)
            </Label>
            <Textarea
              id="receptionist-keywords"
              value={displayEmergencyKeywords}
              onChange={(e) => setEmergencyKeywords(e.target.value)}
              rows={2}
              placeholder="emergency, flood, leak, fire..."
            />
            <p className="text-[10px] text-muted-foreground">
              When a caller mentions any of these words, the call will be routed
              as an emergency.
            </p>
          </div>

          {/* Emergency Phone */}
          <div className="space-y-2">
            <Label htmlFor="receptionist-emergency-phone">
              Emergency Transfer Phone
            </Label>
            <Input
              id="receptionist-emergency-phone"
              value={displayEmergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
            <p className="text-[10px] text-muted-foreground">
              Emergency calls will be transferred to this number.
            </p>
          </div>

          {/* Emergency Action */}
          <div className="space-y-2">
            <Label id="emergency-action-label">Emergency Action</Label>
            <div className="flex items-center gap-4 text-sm" role="status" aria-labelledby="emergency-action-label">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${config.emergencyAction === "transfer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                aria-current={config.emergencyAction === "transfer" ? "true" : undefined}
              >
                Transfer
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${config.emergencyAction === "voicemail" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                aria-current={config.emergencyAction === "voicemail" ? "true" : undefined}
              >
                Voicemail
              </span>
            </div>
          </div>

          {/* Save button */}
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
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
  call: CallLogRecord;
  isExpanded: boolean;
  turns: TranscriptTurn[];
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        aria-label={`Call from ${call.callerName || "Unknown"} at ${formatDate(call.createdAt)}, status ${call.status}${call.isEmergency ? ", emergency" : ""}`}
      >
        <td className="p-3 whitespace-nowrap">{formatDate(call.createdAt)}</td>
        <td className="p-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {call.callerName || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {formatPhone(call.callerPhone)}
            </span>
          </div>
        </td>
        <td className="p-3 whitespace-nowrap">
          {formatDuration(call.duration)}
        </td>
        <td className="p-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[call.status] ?? "bg-zinc-500/20 text-zinc-400"}`}
          >
            {call.isEmergency && (
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            )}
            {call.isEmergency && <span className="sr-only">Emergency</span>}
            {call.status}
          </span>
        </td>
        <td className="p-3">
          {call.sentiment ? (
            <Badge
              variant="outline"
              className={`text-[10px] ${SENTIMENT_COLORS[call.sentiment] ?? ""}`}
            >
              {call.sentiment}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          )}
        </td>
        <td className="p-3 max-w-[200px] truncate text-xs text-muted-foreground">
          {call.summary || "--"}
        </td>
        <td className="p-3">
          {call.bookingCreated ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]"
            >
              Booked
            </Badge>
          ) : call.leadCreated ? (
            <Badge
              variant="outline"
              className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]"
            >
              Lead
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          )}
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
              {call.summary && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    AI Summary
                  </p>
                  <p className="text-sm">{call.summary}</p>
                </div>
              )}

              {/* Linked lead / booking */}
              <div className="flex gap-4">
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
                {call.bookingId && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Booking
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    >
                      Job Booked
                    </Badge>
                  </div>
                )}
              </div>

              {/* Full transcription */}
              {turns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Transcript
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg border border-white/[0.06] p-3 bg-background">
                    {turns.map((turn, i) => (
                      <div
                        key={i}
                        className={`text-sm ${turn.role === "user" ? "text-blue-300" : "text-zinc-300"}`}
                      >
                        <span className="font-semibold">
                          {turn.role === "user" ? "Caller" : "AI Receptionist"}:
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
                    aria-label={`Call recording from ${call.callerName || "Unknown"}`}
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
