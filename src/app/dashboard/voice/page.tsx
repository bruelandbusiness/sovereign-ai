"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneForwarded,
  Clock,
  TrendingUp,
  Play,
  Pause,
  Calendar,
  MessageSquare,
  Star,
  Shield,
  Settings,
  Mic,
  UserCheck,
  Moon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AXIS_STYLE, TOOLTIP_STYLE } from "@/components/charts/chart-theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CallOutcome =
  | "booked_appointment"
  | "answered_question"
  | "took_message"
  | "transferred";

interface RecentCall {
  id: string;
  callerName: string;
  callerNumber: string;
  time: string;
  duration: number;
  outcome: CallOutcome;
  afterHours: boolean;
  transcript: TranscriptMessage[];
  summary: string;
}

interface TranscriptMessage {
  role: "caller" | "ai";
  text: string;
  timestamp: string;
}

interface DailyCallVolume {
  date: string;
  label: string;
  totalCalls: number;
  afterHoursCalls: number;
}

interface VoiceSettings {
  greeting: string;
  voiceStyle: string;
  businessInfo: string;
  transferWhenKeywords: string;
  transferEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

const DEMO_CALLS: RecentCall[] = [
  {
    id: "c1",
    callerName: "Sarah Mitchell",
    callerNumber: "(512) 555-0147",
    time: "2026-03-28T08:12:00",
    duration: 187,
    outcome: "booked_appointment",
    afterHours: false,
    summary:
      "Caller wanted to schedule a deep cleaning for next Tuesday. AI confirmed availability at 2:00 PM and booked the appointment.",
    transcript: [
      {
        role: "ai",
        text: "Good morning! Thank you for calling Prestige Home Services. How can I help you today?",
        timestamp: "0:00",
      },
      {
        role: "caller",
        text: "Hi, I'd like to schedule a deep cleaning for my house.",
        timestamp: "0:05",
      },
      {
        role: "ai",
        text: "I'd be happy to help you schedule a deep cleaning! Could you let me know what day works best for you?",
        timestamp: "0:09",
      },
      {
        role: "caller",
        text: "Is next Tuesday available? Sometime in the afternoon?",
        timestamp: "0:15",
      },
      {
        role: "ai",
        text: "Let me check our availability for next Tuesday... We have openings at 1:00 PM and 2:00 PM. Which would you prefer?",
        timestamp: "0:19",
      },
      {
        role: "caller",
        text: "2 PM works perfectly.",
        timestamp: "0:26",
      },
      {
        role: "ai",
        text: "Great! I've booked your deep cleaning for next Tuesday, March 31st at 2:00 PM. You'll receive a confirmation text shortly. Is there anything else I can help with?",
        timestamp: "0:29",
      },
      {
        role: "caller",
        text: "No, that's all. Thank you!",
        timestamp: "0:38",
      },
      {
        role: "ai",
        text: "You're welcome, Sarah! We look forward to seeing you Tuesday. Have a great day!",
        timestamp: "0:41",
      },
    ],
  },
  {
    id: "c2",
    callerName: "Unknown Caller",
    callerNumber: "(737) 555-0293",
    time: "2026-03-28T06:47:00",
    duration: 94,
    outcome: "answered_question",
    afterHours: true,
    summary:
      "After-hours call asking about pricing for weekly service. AI provided pricing tiers and offered to schedule a callback.",
    transcript: [
      {
        role: "ai",
        text: "Thank you for calling Prestige Home Services. Our office is currently closed, but I can help answer your questions. How can I assist you?",
        timestamp: "0:00",
      },
      {
        role: "caller",
        text: "How much do you charge for weekly cleaning?",
        timestamp: "0:06",
      },
      {
        role: "ai",
        text: "Our weekly cleaning service starts at $120 for a standard home, with our premium package at $180 which includes inside appliances and windows. Would you like me to have someone call you back during business hours to discuss a custom quote?",
        timestamp: "0:10",
      },
      {
        role: "caller",
        text: "That sounds reasonable. No need for a callback, I'll call back later. Thanks!",
        timestamp: "0:22",
      },
      {
        role: "ai",
        text: "You're welcome! We're open Monday through Friday, 8 AM to 6 PM. Have a great day!",
        timestamp: "0:28",
      },
    ],
  },
  {
    id: "c3",
    callerName: "Michael Torres",
    callerNumber: "(512) 555-0831",
    time: "2026-03-27T22:15:00",
    duration: 132,
    outcome: "took_message",
    afterHours: true,
    summary:
      "After-hours call from existing client about rescheduling Thursday appointment. AI took a message for morning callback.",
    transcript: [
      {
        role: "ai",
        text: "Thank you for calling Prestige Home Services. Our office is currently closed, but I'm happy to help. How can I assist you?",
        timestamp: "0:00",
      },
      {
        role: "caller",
        text: "Hey, I need to reschedule my appointment for Thursday. Something came up.",
        timestamp: "0:05",
      },
      {
        role: "ai",
        text: "I understand, Michael. I can take a message and have our scheduling team reach out to you first thing in the morning to find a new time. Does that work for you?",
        timestamp: "0:11",
      },
      {
        role: "caller",
        text: "Yeah, that'd be great. Just have them call my cell.",
        timestamp: "0:18",
      },
      {
        role: "ai",
        text: "Perfect. I've noted your request to reschedule your Thursday appointment. Our team will call you at this number tomorrow morning. Is there anything else?",
        timestamp: "0:22",
      },
      {
        role: "caller",
        text: "Nope, thanks!",
        timestamp: "0:30",
      },
    ],
  },
  {
    id: "c4",
    callerName: "Jennifer Park",
    callerNumber: "(512) 555-0562",
    time: "2026-03-27T14:33:00",
    duration: 246,
    outcome: "transferred",
    afterHours: false,
    summary:
      "Caller had a billing complaint about being double-charged. AI gathered details and transferred to the billing department.",
    transcript: [
      {
        role: "ai",
        text: "Good afternoon! Thank you for calling Prestige Home Services. How can I help you today?",
        timestamp: "0:00",
      },
      {
        role: "caller",
        text: "I was charged twice for my last service and I need this resolved immediately.",
        timestamp: "0:04",
      },
      {
        role: "ai",
        text: "I'm sorry to hear about the billing issue, Jennifer. I want to make sure this gets resolved properly. Can you tell me which service date the double charge is for?",
        timestamp: "0:09",
      },
      {
        role: "caller",
        text: "It was March 20th. I see two charges of $150 each on my card.",
        timestamp: "0:16",
      },
      {
        role: "ai",
        text: "Thank you for providing that detail. I understand how frustrating that must be. Let me connect you with our billing specialist who can process the refund for you right away. One moment please.",
        timestamp: "0:22",
      },
      {
        role: "caller",
        text: "Okay, thank you.",
        timestamp: "0:30",
      },
      {
        role: "ai",
        text: "Transferring you now. Jennifer, thank you for your patience and I apologize again for the inconvenience.",
        timestamp: "0:32",
      },
    ],
  },
  {
    id: "c5",
    callerName: "David Chen",
    callerNumber: "(737) 555-0718",
    time: "2026-03-27T11:05:00",
    duration: 156,
    outcome: "booked_appointment",
    afterHours: false,
    summary:
      "New customer booked a first-time home assessment for this Friday at 10 AM.",
    transcript: [
      {
        role: "ai",
        text: "Good morning! Thank you for calling Prestige Home Services. How can I help you today?",
        timestamp: "0:00",
      },
      {
        role: "caller",
        text: "Hi, I just moved to the area and I'm looking for a regular cleaning service. Do you do assessments?",
        timestamp: "0:04",
      },
      {
        role: "ai",
        text: "Welcome to the neighborhood! Yes, we offer a free in-home assessment where we evaluate your space and provide a customized cleaning plan and quote. Would you like to schedule one?",
        timestamp: "0:12",
      },
      {
        role: "caller",
        text: "That sounds great. What do you have available this week?",
        timestamp: "0:20",
      },
      {
        role: "ai",
        text: "We have availability this Friday at 10 AM or 3 PM. Which works better for you?",
        timestamp: "0:24",
      },
      {
        role: "caller",
        text: "10 AM Friday works. My address is 4521 Oak Hill Drive.",
        timestamp: "0:29",
      },
      {
        role: "ai",
        text: "Perfect! I've booked your free home assessment for Friday, March 28th at 10:00 AM at 4521 Oak Hill Drive. You'll get a confirmation text shortly. We look forward to meeting you!",
        timestamp: "0:34",
      },
    ],
  },
  {
    id: "c6",
    callerName: "Lisa Ramirez",
    callerNumber: "(512) 555-0945",
    time: "2026-03-27T05:22:00",
    duration: 68,
    outcome: "answered_question",
    afterHours: true,
    summary:
      "Early morning call asking about service area. AI confirmed coverage in the caller's zip code.",
    transcript: [
      {
        role: "ai",
        text: "Thank you for calling Prestige Home Services. Our office is currently closed, but I can help answer your questions.",
        timestamp: "0:00",
      },
      {
        role: "caller",
        text: "Do you service the 78745 zip code?",
        timestamp: "0:05",
      },
      {
        role: "ai",
        text: "Yes! We service the entire Austin metro area, including 78745. That's well within our coverage zone. Would you like to know more about our services?",
        timestamp: "0:08",
      },
      {
        role: "caller",
        text: "No, just wanted to check. I'll call back during business hours.",
        timestamp: "0:15",
      },
      {
        role: "ai",
        text: "Sounds great! We're open Monday through Friday, 8 AM to 6 PM. We'd love to hear from you!",
        timestamp: "0:18",
      },
    ],
  },
  {
    id: "c7",
    callerName: "Robert Kim",
    callerNumber: "(512) 555-0223",
    time: "2026-03-26T15:48:00",
    duration: 203,
    outcome: "transferred",
    afterHours: false,
    summary:
      "Existing client requested to speak with their regular cleaning team lead about a custom request. AI transferred the call.",
    transcript: [
      {
        role: "ai",
        text: "Good afternoon! Thank you for calling Prestige Home Services. How can I help you today?",
        timestamp: "0:00",
      },
      {
        role: "caller",
        text: "Can I speak with Maria? She's my usual team lead. I want to discuss some special cleaning for a party I'm hosting.",
        timestamp: "0:05",
      },
      {
        role: "ai",
        text: "Of course, Robert! Let me transfer you to Maria. She'd be the best person to help you plan for your party. One moment please.",
        timestamp: "0:14",
      },
    ],
  },
  {
    id: "c8",
    callerName: "Amanda Foster",
    callerNumber: "(737) 555-0456",
    time: "2026-03-26T20:31:00",
    duration: 110,
    outcome: "took_message",
    afterHours: true,
    summary:
      "After-hours call to report a key left at the client's house. AI logged the message for follow-up.",
    transcript: [
      {
        role: "ai",
        text: "Thank you for calling Prestige Home Services. Our office is currently closed. How can I assist you?",
        timestamp: "0:00",
      },
      {
        role: "caller",
        text: "Your team left a key at my house today. I found it on the kitchen counter.",
        timestamp: "0:05",
      },
      {
        role: "ai",
        text: "Thank you for letting us know, Amanda! I'll make sure to pass that message along to the team first thing in the morning so they can arrange to pick it up. Is the key safe where it is for now?",
        timestamp: "0:11",
      },
      {
        role: "caller",
        text: "Yes, it's fine. Just wanted to let you know.",
        timestamp: "0:19",
      },
      {
        role: "ai",
        text: "We appreciate you reaching out. Someone will follow up with you tomorrow. Have a good evening!",
        timestamp: "0:22",
      },
    ],
  },
];

function generateCallVolumeData(): DailyCallVolume[] {
  const data: DailyCallVolume[] = [];
  const today = new Date(2026, 2, 28);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseCalls = isWeekend
      ? Math.floor(Math.random() * 5) + 3
      : Math.floor(Math.random() * 10) + 8;
    const afterHours = Math.floor(baseCalls * (0.2 + Math.random() * 0.25));
    data.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      totalCalls: baseCalls,
      afterHoursCalls: afterHours,
    });
  }
  return data;
}

const CALL_VOLUME_DATA = generateCallVolumeData();

const INITIAL_SETTINGS: VoiceSettings = {
  greeting:
    "Thank you for calling Prestige Home Services! I'm your AI assistant and I'm happy to help. How can I assist you today?",
  voiceStyle: "professional-female",
  businessInfo:
    "We are a premium home cleaning service in Austin, TX. Services: standard cleaning ($120), deep cleaning ($180), move-in/move-out ($250). Hours: Mon-Fri 8 AM - 6 PM. Service area: Greater Austin metro (zip codes 787xx, 786xx). Free in-home assessments available.",
  transferWhenKeywords:
    "billing issue, refund, complaint, speak to manager, existing appointment change, emergency",
  transferEnabled: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeTime(dateStr: string): string {
  const now = new Date(2026, 2, 28, 10, 0, 0);
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const OUTCOME_CONFIG: Record<
  CallOutcome,
  { label: string; color: string; icon: typeof Calendar }
> = {
  booked_appointment: {
    label: "Booked Appointment",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: Calendar,
  },
  answered_question: {
    label: "Answered Question",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: MessageSquare,
  },
  took_message: {
    label: "Took Message",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: PhoneMissed,
  },
  transferred: {
    label: "Transferred",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: PhoneForwarded,
  },
};

const VOICE_STYLES = [
  { value: "professional-female", label: "Professional Female" },
  { value: "professional-male", label: "Professional Male" },
  { value: "friendly-female", label: "Friendly Female" },
  { value: "friendly-male", label: "Friendly Male" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subtitle,
}: {
  icon: typeof Phone;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card className="border-white/[0.06]">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CallFeedItem({
  call,
  isSelected,
  onSelect,
}: {
  call: RecentCall;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const outcome = OUTCOME_CONFIG[call.outcome];
  const OutcomeIcon = outcome.icon;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${
        isSelected ? "bg-white/[0.05] border-l-2 border-l-blue-500" : ""
      }`}
      aria-label={`Call from ${call.callerName}, ${outcome.label}`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">
              {call.callerName}
            </span>
            {call.afterHours && (
              <Moon
                className="h-3 w-3 text-indigo-400 shrink-0"
                aria-label="After hours call"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {call.callerNumber}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {call.summary}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[11px] text-muted-foreground">
            {relativeTime(call.time)}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] ${outcome.color} flex items-center gap-1`}
          >
            <OutcomeIcon className="h-2.5 w-2.5" aria-hidden="true" />
            {outcome.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatDuration(call.duration)}
          </span>
        </div>
      </div>
    </button>
  );
}

function PlayButton({ small }: { small?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const size = small ? "h-7 w-7" : "h-8 w-8";
  const iconSize = small ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setPlaying(!playing);
      }}
      className={`${size} rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors`}
      aria-label={playing ? "Pause recording" : "Play recording"}
    >
      {playing ? (
        <Pause className={iconSize} />
      ) : (
        <Play className={`${iconSize} ml-0.5`} />
      )}
    </button>
  );
}

function TranscriptViewer({ call }: { call: RecentCall }) {
  return (
    <div className="space-y-4">
      {/* Call header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{call.callerName}</h3>
          <p className="text-xs text-muted-foreground">
            {formatTime(call.time)} -- {formatDuration(call.duration)}
            {call.afterHours && " -- After Hours"}
          </p>
        </div>
        <PlayButton />
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-1">
          AI Summary
        </p>
        <p className="text-sm">{call.summary}</p>
      </div>

      {/* Transcript */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Conversation
        </p>
        <div
          className="space-y-3 max-h-[400px] overflow-y-auto pr-1"
          role="log"
          aria-label="Call transcript"
        >
          {call.transcript.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "caller" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                  msg.role === "caller"
                    ? "bg-white/[0.06] text-foreground/90 rounded-bl-sm"
                    : "bg-blue-600/20 text-blue-100 rounded-br-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-semibold ${
                      msg.role === "caller"
                        ? "text-amber-400"
                        : "text-blue-400"
                    }`}
                  >
                    {msg.role === "caller" ? "Caller" : "AI Agent"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CallVolumeChart({ data }: { data: DailyCallVolume[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={data}
        margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
      >
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="afterHoursGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={AXIS_STYLE.stroke}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          stroke={AXIS_STYLE.stroke}
          tick={AXIS_STYLE.tick}
          axisLine={AXIS_STYLE.axisLine}
          tickLine={AXIS_STYLE.tickLine}
          interval={4}
        />
        <YAxis
          stroke={AXIS_STYLE.stroke}
          tick={AXIS_STYLE.tick}
          axisLine={AXIS_STYLE.axisLine}
          tickLine={AXIS_STYLE.tickLine}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE.contentStyle}
          labelStyle={TOOLTIP_STYLE.labelStyle}
          itemStyle={TOOLTIP_STYLE.itemStyle}
          cursor={TOOLTIP_STYLE.cursor}
        />
        <ReferenceLine y={0} stroke={AXIS_STYLE.stroke} />
        <Area
          type="monotone"
          dataKey="totalCalls"
          name="Total Calls"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#totalGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "#3b82f6" }}
        />
        <Area
          type="monotone"
          dataKey="afterHoursCalls"
          name="After Hours"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#afterHoursGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "#8b5cf6" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function VoiceSettingsPanel({
  settings,
  onUpdate,
}: {
  settings: VoiceSettings;
  onUpdate: (s: VoiceSettings) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <label
          htmlFor="voice-greeting"
          className="text-sm font-medium mb-1.5 block"
        >
          Business Greeting
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          The first thing callers hear when your AI answers.
        </p>
        <Textarea
          id="voice-greeting"
          value={settings.greeting}
          onChange={(e) =>
            onUpdate({ ...settings, greeting: e.target.value })
          }
          rows={3}
          className="text-sm"
        />
      </div>

      {/* Voice Style */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Voice Style
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Choose how your AI agent sounds to callers.
        </p>
        <Select
          value={settings.voiceStyle}
          onValueChange={(val) =>
            onUpdate({ ...settings, voiceStyle: val as string })
          }
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICE_STYLES.map((vs) => (
              <SelectItem key={vs.value} value={vs.value}>
                {vs.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Business Info */}
      <div>
        <label
          htmlFor="voice-business-info"
          className="text-sm font-medium mb-1.5 block"
        >
          Business Knowledge Base
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Information the AI should know: services, pricing, hours, policies,
          FAQs.
        </p>
        <Textarea
          id="voice-business-info"
          value={settings.businessInfo}
          onChange={(e) =>
            onUpdate({ ...settings, businessInfo: e.target.value })
          }
          rows={5}
          className="text-sm"
        />
      </div>

      {/* Transfer Rules */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-sm font-medium block">
              Human Transfer Rules
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              When should the AI transfer the caller to a human?
            </p>
          </div>
          <Switch
            checked={settings.transferEnabled}
            onCheckedChange={(checked) =>
              onUpdate({ ...settings, transferEnabled: checked })
            }
            aria-label="Enable call transfers"
          />
        </div>
        {settings.transferEnabled && (
          <div>
            <label
              htmlFor="voice-transfer-keywords"
              className="text-xs text-muted-foreground mb-1 block"
            >
              Transfer when caller mentions (comma-separated)
            </label>
            <Input
              id="voice-transfer-keywords"
              value={settings.transferWhenKeywords}
              onChange={(e) =>
                onUpdate({
                  ...settings,
                  transferWhenKeywords: e.target.value,
                })
              }
              className="text-sm"
              placeholder="billing issue, refund, speak to manager..."
            />
          </div>
        )}
      </div>

      <Button className="w-full sm:w-auto">Save Voice Settings</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function VoiceDashboardPage() {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(
    DEMO_CALLS[0].id
  );
  const [voiceSettings, setVoiceSettings] =
    useState<VoiceSettings>(INITIAL_SETTINGS);

  const selectedCall = useMemo(
    () => DEMO_CALLS.find((c) => c.id === selectedCallId) ?? null,
    [selectedCallId]
  );

  // Computed KPIs
  const totalCallsMonth = 247;
  const afterHoursSaved = 89;
  const avgCallDuration = "2:34";
  const satisfactionScore = 4.8;
  const callsTransferred = 31;
  const missedCallsSaved = 89;
  const estimatedRevenueSaved = 12_680;

  const handleSelectCall = useCallback((id: string) => {
    setSelectedCallId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background page-enter">
        <Header variant="minimal" />

        <main className="flex-1 py-8">
          <Container>
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Phone className="h-6 w-6 text-blue-400" aria-hidden="true" />
                  AI Voice Agent
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Your AI answers every call 24/7 -- never miss a customer
                  again.
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1"
              >
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live -- Answering Calls
              </Badge>
            </div>

            {/* Value Demonstration Banner */}
            <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] to-blue-500/[0.06] mb-6">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-emerald-500/15 p-3">
                      <Shield
                        className="h-7 w-7 text-emerald-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        Your AI saved you from missing{" "}
                        <span className="text-emerald-400">
                          {missedCallsSaved} calls
                        </span>{" "}
                        this month
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Including {afterHoursSaved} after-hours calls that would
                        have gone to voicemail
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Est. Revenue Saved
                      </p>
                      <p className="text-2xl font-bold text-emerald-400">
                        ${estimatedRevenueSaved.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div
              className="grid grid-cols-2 gap-4 lg:grid-cols-5 mb-6"
              role="region"
              aria-label="Voice agent performance metrics"
            >
              <KpiCard
                icon={Phone}
                iconBg="bg-blue-500/10"
                iconColor="text-blue-400"
                label="Calls Answered"
                value={totalCallsMonth}
                subtitle="This month"
              />
              <KpiCard
                icon={Moon}
                iconBg="bg-indigo-500/10"
                iconColor="text-indigo-400"
                label="After-Hours Saved"
                value={afterHoursSaved}
                subtitle="Would have been missed"
              />
              <KpiCard
                icon={Clock}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-400"
                label="Avg Call Duration"
                value={avgCallDuration}
                subtitle="Minutes"
              />
              <KpiCard
                icon={Star}
                iconBg="bg-yellow-500/10"
                iconColor="text-yellow-400"
                label="Satisfaction Score"
                value={`${satisfactionScore}/5`}
                subtitle="Based on post-call survey"
              />
              <KpiCard
                icon={UserCheck}
                iconBg="bg-purple-500/10"
                iconColor="text-purple-400"
                label="Transferred to Human"
                value={callsTransferred}
                subtitle={`${Math.round((callsTransferred / totalCallsMonth) * 100)}% of calls`}
              />
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="calls">
              <TabsList className="mb-6">
                <TabsTrigger value="calls">
                  <PhoneIncoming
                    className="h-4 w-4 mr-1.5"
                    aria-hidden="true"
                  />
                  Recent Calls
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp
                    className="h-4 w-4 mr-1.5"
                    aria-hidden="true"
                  />
                  Call Volume
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings
                    className="h-4 w-4 mr-1.5"
                    aria-hidden="true"
                  />
                  Voice Settings
                </TabsTrigger>
              </TabsList>

              {/* --- Recent Calls Tab --- */}
              <TabsContent value="calls">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Call Feed */}
                  <Card className="border-white/[0.06] lg:col-span-2 overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06]">
                      <h2 className="font-semibold text-sm">Recent Calls</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Click a call to view the transcript
                      </p>
                    </div>
                    <div
                      className="max-h-[600px] overflow-y-auto"
                      role="list"
                      aria-label="Recent phone calls"
                    >
                      {DEMO_CALLS.map((call) => (
                        <CallFeedItem
                          key={call.id}
                          call={call}
                          isSelected={selectedCallId === call.id}
                          onSelect={() => handleSelectCall(call.id)}
                        />
                      ))}
                    </div>
                  </Card>

                  {/* Transcript Viewer */}
                  <Card className="border-white/[0.06] lg:col-span-3">
                    <CardContent className="p-5">
                      {selectedCall ? (
                        <TranscriptViewer call={selectedCall} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <Mic
                            className="h-10 w-10 mb-3 opacity-30"
                            aria-hidden="true"
                          />
                          <p className="text-sm font-medium">
                            Select a call to view the transcript
                          </p>
                          <p className="text-xs mt-1">
                            Click any call on the left to see the AI
                            conversation
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Outcome Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {(
                    [
                      "booked_appointment",
                      "answered_question",
                      "took_message",
                      "transferred",
                    ] as CallOutcome[]
                  ).map((outcome) => {
                    const config = OUTCOME_CONFIG[outcome];
                    const count = DEMO_CALLS.filter(
                      (c) => c.outcome === outcome
                    ).length;
                    const Icon = config.icon;
                    return (
                      <Card
                        key={outcome}
                        className="border-white/[0.06]"
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${config.color.split(" ")[0]}`}
                          >
                            <Icon
                              className={`h-4 w-4 ${config.color.split(" ")[1]}`}
                              aria-hidden="true"
                            />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">
                              {config.label}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* --- Call Volume Tab --- */}
              <TabsContent value="analytics">
                <Card className="border-white/[0.06]">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="font-semibold">
                          Call Volume -- Last 30 Days
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Total calls vs. after-hours calls per day
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                          Total Calls
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500" />
                          After Hours
                        </span>
                      </div>
                    </div>
                    <CallVolumeChart data={CALL_VOLUME_DATA} />
                  </CardContent>
                </Card>

                {/* Volume Insights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <Card className="border-white/[0.06]">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Peak Call Day
                      </p>
                      <p className="text-lg font-bold">Tuesdays</p>
                      <p className="text-xs text-muted-foreground">
                        Avg 14 calls on Tuesdays
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-white/[0.06]">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        Busiest Hour
                      </p>
                      <p className="text-lg font-bold">10:00 AM - 11:00 AM</p>
                      <p className="text-xs text-muted-foreground">
                        22% of daily calls
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-white/[0.06]">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">
                        After-Hours Rate
                      </p>
                      <p className="text-lg font-bold">36%</p>
                      <p className="text-xs text-muted-foreground">
                        of calls come outside business hours
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* --- Voice Settings Tab --- */}
              <TabsContent value="settings">
                <Card className="border-white/[0.06]">
                  <CardContent className="p-5">
                    <div className="mb-5">
                      <h2 className="font-semibold flex items-center gap-2">
                        <Settings
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        Voice Agent Configuration
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Customize how your AI agent handles phone calls.
                      </p>
                    </div>
                    <VoiceSettingsPanel
                      settings={voiceSettings}
                      onUpdate={setVoiceSettings}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </Container>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
