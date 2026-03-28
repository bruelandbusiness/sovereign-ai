"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  MessageSquare,
  User,
  Zap,
  TrendingUp,
  UserCheck,
  Moon,
  Shield,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Smile,
  Bot,
  ArrowRightLeft,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiCard } from "@/components/ui/KpiCard";
import { AnimatedProgressBar } from "@/components/ui/AnimatedProgressBar";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { SEMANTIC_COLORS } from "@/components/charts/chart-theme";

// ── Demo Data ───────────────────────────────────────────────

function generateDemoChartData() {
  const data: Record<string, unknown>[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const baseConvs = 18 + Math.floor(Math.random() * 14);
    const leads = Math.floor(baseConvs * (0.15 + Math.random() * 0.15));
    data.push({ date: label, conversations: baseConvs, leads });
  }
  return data;
}

type ConversationStatus =
  | "lead_captured"
  | "question_answered"
  | "transferred";

interface DemoConversation {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: ConversationStatus;
  preview: string;
  messageCount: number;
  createdAt: string;
  isAfterHours: boolean;
  transcript: { role: "user" | "assistant"; content: string }[];
}

interface QAPair {
  id: string;
  question: string;
  answer: string;
}

interface EscalationRule {
  id: string;
  trigger: string;
  action: string;
}

const STATUS_CONFIG: Record<
  ConversationStatus,
  { label: string; variant: "qualified" | "responded" | "contacted" }
> = {
  lead_captured: { label: "Lead Captured", variant: "qualified" },
  question_answered: { label: "Question Answered", variant: "responded" },
  transferred: { label: "Transferred to Human", variant: "contacted" },
};

function generateDemoConversations(): DemoConversation[] {
  const now = new Date();
  return [
    {
      id: "conv-1",
      visitorName: "Sarah Mitchell",
      visitorEmail: "sarah.m@gmail.com",
      status: "lead_captured",
      preview:
        "Hi, I need a quote for replacing my water heater. It's a 50-gallon tank...",
      messageCount: 8,
      createdAt: new Date(now.getTime() - 12 * 60000).toISOString(),
      isAfterHours: false,
      transcript: [
        {
          role: "user",
          content:
            "Hi, I need a quote for replacing my water heater. It's a 50-gallon tank.",
        },
        {
          role: "assistant",
          content:
            "Hi Sarah! We'd be happy to help with your water heater replacement. A 50-gallon tank is one of the most common sizes we work with. Can I ask -- is it gas or electric?",
        },
        {
          role: "user",
          content: "It's gas. Probably 12 years old at this point.",
        },
        {
          role: "assistant",
          content:
            "Got it -- 12 years is right around the typical lifespan for a gas water heater. We can definitely get you a competitive quote. Would you like to schedule a free in-home estimate? I just need your phone number and a good time to reach you.",
        },
        {
          role: "user",
          content: "Sure, my number is 555-0142. Mornings work best.",
        },
        {
          role: "assistant",
          content:
            "Perfect! I've got you down -- 555-0142, mornings preferred. One of our technicians will give you a call tomorrow morning to schedule the estimate. Is there anything else I can help with?",
        },
        { role: "user", content: "That's it, thanks!" },
        {
          role: "assistant",
          content:
            "You're welcome, Sarah! We look forward to helping you out. Have a great day!",
        },
      ],
    },
    {
      id: "conv-2",
      visitorName: "Mike Rodriguez",
      visitorEmail: null,
      status: "lead_captured",
      preview:
        "Do you guys do emergency plumbing? My kitchen sink is backed up and...",
      messageCount: 6,
      createdAt: new Date(now.getTime() - 45 * 60000).toISOString(),
      isAfterHours: true,
      transcript: [
        {
          role: "user",
          content:
            "Do you guys do emergency plumbing? My kitchen sink is backed up and overflowing.",
        },
        {
          role: "assistant",
          content:
            "Yes, we absolutely do! A backed-up kitchen sink sounds urgent. We can typically get a technician out within 1-2 hours for emergencies. Can I get your name and address to dispatch someone right away?",
        },
        {
          role: "user",
          content:
            "Mike Rodriguez, 1847 Oak Street. How much does an emergency call cost?",
        },
        {
          role: "assistant",
          content:
            "Thanks Mike! Our emergency service call is $89, which covers the trip and diagnosis. The actual repair cost depends on the issue, but we always provide an upfront quote before any work begins. Can I get your phone number so the technician can call when they're on the way?",
        },
        { role: "user", content: "555-0298" },
        {
          role: "assistant",
          content:
            "Got it! I'm sending your info to our dispatch team now. Someone will call you at 555-0298 very shortly. Hang tight, Mike -- help is on the way!",
        },
      ],
    },
    {
      id: "conv-3",
      visitorName: null,
      visitorEmail: null,
      status: "question_answered",
      preview:
        "What areas do you service? I'm in the north side of town...",
      messageCount: 4,
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      isAfterHours: false,
      transcript: [
        {
          role: "user",
          content:
            "What areas do you service? I'm in the north side of town near the mall.",
        },
        {
          role: "assistant",
          content:
            "Great question! We service the entire metro area within a 30-mile radius, so the north side is definitely in our coverage zone. We're out there regularly!",
        },
        { role: "user", content: "Do you offer free estimates?" },
        {
          role: "assistant",
          content:
            "Yes! We offer free in-home estimates for most projects. Whether it's a repair, replacement, or new installation, we'll come out, assess the situation, and give you an honest, upfront quote with no obligation.",
        },
      ],
    },
    {
      id: "conv-4",
      visitorName: "Jennifer Park",
      visitorEmail: "jpark@outlook.com",
      status: "lead_captured",
      preview:
        "I'm looking at getting a whole-house water filtration system installed...",
      messageCount: 10,
      createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      isAfterHours: false,
      transcript: [
        {
          role: "user",
          content:
            "I'm looking at getting a whole-house water filtration system installed. Do you do that?",
        },
        {
          role: "assistant",
          content:
            "Absolutely! Water filtration is one of our specialties. We offer several options depending on your needs and budget. Do you know if you have any specific water quality concerns?",
        },
        {
          role: "user",
          content:
            "The water tastes like chlorine and leaves spots on everything.",
        },
        {
          role: "assistant",
          content:
            "That's really common in this area. A whole-house carbon filtration system paired with a water softener would take care of both issues. We can also do a free water quality test to identify exactly what we're dealing with. Would you like to schedule that?",
        },
        {
          role: "user",
          content: "Yes please! My email is jpark@outlook.com",
        },
        {
          role: "assistant",
          content:
            "Wonderful! I'll have our water quality specialist reach out to you at jpark@outlook.com to schedule the free test. It usually takes about 30 minutes and we'll walk you through all the results. Can I also get your phone number in case we need to confirm the appointment?",
        },
        { role: "user", content: "555-0187" },
        {
          role: "assistant",
          content:
            "Perfect, Jennifer. We'll be in touch within 24 hours to get that water test scheduled. You're going to love the difference clean water makes!",
        },
        {
          role: "user",
          content:
            "Can you also look at my bathroom faucet? It's been dripping.",
        },
        {
          role: "assistant",
          content:
            "Absolutely! We'll add the dripping faucet to the visit notes so the technician comes prepared. One trip, two fixes -- very efficient! Anything else on your list?",
        },
      ],
    },
    {
      id: "conv-5",
      visitorName: "David Chen",
      visitorEmail: null,
      status: "transferred",
      preview:
        "I have a warranty question about work you did last year. My invoice number is...",
      messageCount: 5,
      createdAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      isAfterHours: false,
      transcript: [
        {
          role: "user",
          content:
            "I have a warranty question about work you did last year. My invoice number is #4521.",
        },
        {
          role: "assistant",
          content:
            "Hi David! I'd be happy to help with your warranty question. I can see you're referencing invoice #4521. Could you tell me a bit more about the issue you're experiencing?",
        },
        {
          role: "user",
          content:
            "The garbage disposal you installed is making a grinding noise and it's only been 10 months.",
        },
        {
          role: "assistant",
          content:
            "That definitely sounds like something that should be covered under warranty. Let me connect you with our service manager who can look up your specific warranty terms and get this resolved quickly for you.",
        },
        {
          role: "user",
          content: "Thanks, that would be great.",
        },
      ],
    },
    {
      id: "conv-6",
      visitorName: null,
      visitorEmail: null,
      status: "question_answered",
      preview:
        "What are your business hours? I need to schedule something for Saturday...",
      messageCount: 3,
      createdAt: new Date(now.getTime() - 22 * 3600000).toISOString(),
      isAfterHours: true,
      transcript: [
        {
          role: "user",
          content:
            "What are your business hours? I need to schedule something for Saturday.",
        },
        {
          role: "assistant",
          content:
            "We're open Monday through Friday from 7 AM to 6 PM, and Saturdays from 8 AM to 2 PM. We also offer emergency service 24/7 for urgent issues. Saturday appointments fill up fast, so I'd recommend booking soon!",
        },
        {
          role: "user",
          content: "Ok thanks, I'll call in the morning.",
        },
      ],
    },
    {
      id: "conv-7",
      visitorName: "Amanda Brooks",
      visitorEmail: "amanda.b@yahoo.com",
      status: "lead_captured",
      preview:
        "We're remodeling our master bathroom and need a plumber for the rough-in...",
      messageCount: 7,
      createdAt: new Date(now.getTime() - 26 * 3600000).toISOString(),
      isAfterHours: false,
      transcript: [
        {
          role: "user",
          content:
            "We're remodeling our master bathroom and need a plumber for the rough-in work. Do you work with general contractors?",
        },
        {
          role: "assistant",
          content:
            "Absolutely! We work with GCs on remodel projects all the time. We can handle everything from rough-in plumbing to fixture installation. What's the scope of the remodel?",
        },
        {
          role: "user",
          content:
            "Full gut renovation -- moving the shower, adding a freestanding tub, double vanity. Our GC is ready to start demo next week.",
        },
        {
          role: "assistant",
          content:
            "That sounds like a beautiful project! With demo starting next week, we'd want to get a look at the space ASAP to plan the rough-in. Can we schedule a walkthrough with you and your GC?",
        },
        {
          role: "user",
          content:
            "Yes, my email is amanda.b@yahoo.com, phone is 555-0331.",
        },
        {
          role: "assistant",
          content:
            "Got it, Amanda! I'll have our estimator reach out today to coordinate a walkthrough. We'll make sure the plumbing plan aligns perfectly with your renovation vision.",
        },
        { role: "user", content: "Wonderful, thanks so much!" },
      ],
    },
  ];
}

const DEMO_METRICS = {
  totalConversations: 847,
  leadsCaptured: 156,
  avgResponseTime: "< 3 seconds",
  satisfactionScore: 4.8,
  autonomousRate: 94,
  afterHoursConversations: 203,
  convSparkline: [14, 18, 22, 19, 25, 28, 24, 31, 27, 33, 29, 35],
  leadSparkline: [2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9],
};

const INITIAL_QA_PAIRS: QAPair[] = [
  {
    id: "qa-1",
    question: "What are your service hours?",
    answer:
      "We're available Monday-Friday 7AM-6PM and Saturday 8AM-2PM. Emergency service is available 24/7.",
  },
  {
    id: "qa-2",
    question: "Do you offer free estimates?",
    answer:
      "Yes! We provide free in-home estimates for most projects with no obligation.",
  },
  {
    id: "qa-3",
    question: "What areas do you serve?",
    answer:
      "We serve the entire metro area within a 30-mile radius of downtown.",
  },
];

const INITIAL_ESCALATION_RULES: EscalationRule[] = [
  {
    id: "esc-1",
    trigger: "Visitor asks about warranty claims",
    action: "Transfer to service manager",
  },
  {
    id: "esc-2",
    trigger: "Visitor mentions legal issue or complaint",
    action: "Transfer to owner immediately",
  },
  {
    id: "esc-3",
    trigger: "Visitor requests human agent 3+ times",
    action: "Transfer to next available team member",
  },
];

const TONE_OPTIONS = [
  {
    value: "professional",
    label: "Professional",
    description: "Polished and business-appropriate",
    icon: Shield,
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm, approachable, and conversational",
    icon: Smile,
  },
  {
    value: "casual",
    label: "Casual",
    description: "Relaxed and down-to-earth",
    icon: Bot,
  },
] as const;

// ── Helper: relative time ───────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Component ───────────────────────────────────────────────

export function ChatbotDashboard() {
  const [copied, setCopied] = useState(false);
  const [expandedConv, setExpandedConv] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(
    "Hi there! Welcome to Acme Plumbing. How can we help you today?"
  );
  const [afterHoursEnabled, setAfterHoursEnabled] = useState(true);
  const [tone, setTone] = useState<"professional" | "friendly" | "casual">(
    "friendly"
  );
  const [qaPairs, setQaPairs] = useState<QAPair[]>(INITIAL_QA_PAIRS);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>(
    INITIAL_ESCALATION_RULES
  );
  const [isActive, setIsActive] = useState(true);

  const chartData = useMemo(() => generateDemoChartData(), []);
  const conversations = useMemo(() => generateDemoConversations(), []);

  const chatbotId = "cb_demo_a1b2c3d4";
  const embedSnippet = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/chatbot.js" data-chatbot-id="${chatbotId}"></script>`;

  const handleCopyEmbed = useCallback(() => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [embedSnippet]);

  const addQaPair = useCallback(() => {
    setQaPairs((prev) => [
      ...prev,
      { id: `qa-${Date.now()}`, question: "", answer: "" },
    ]);
  }, []);

  const updateQaPair = useCallback(
    (id: string, field: "question" | "answer", value: string) => {
      setQaPairs((prev) =>
        prev.map((qa) => (qa.id === id ? { ...qa, [field]: value } : qa))
      );
    },
    []
  );

  const removeQaPair = useCallback((id: string) => {
    setQaPairs((prev) => prev.filter((qa) => qa.id !== id));
  }, []);

  const addEscalationRule = useCallback(() => {
    setEscalationRules((prev) => [
      ...prev,
      { id: `esc-${Date.now()}`, trigger: "", action: "" },
    ]);
  }, []);

  const updateEscalationRule = useCallback(
    (id: string, field: "trigger" | "action", value: string) => {
      setEscalationRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  const removeEscalationRule = useCallback((id: string) => {
    setEscalationRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const leadsThisMonth = conversations.filter(
    (c) => c.status === "lead_captured"
  ).length;

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" aria-label="Back to dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">AI Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Real-time performance metrics, conversations, and configuration
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant={isActive ? "qualified" : "secondary"}>
            {isActive ? "Live on Website" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance">
        <TabsList className="mb-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* ─── Performance Tab ──────────────────────────────── */}
        <TabsContent value="performance">
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                title="Total Conversations This Month"
                value={DEMO_METRICS.totalConversations}
                trend="+23% vs last month"
                trendUp
                sparklineData={DEMO_METRICS.convSparkline}
              />
              <KpiCard
                title="Leads Captured by Chatbot"
                value={DEMO_METRICS.leadsCaptured}
                trend="+31% vs last month"
                trendUp
                sparklineData={DEMO_METRICS.leadSparkline}
              />
              <KpiCard
                title="Customer Satisfaction"
                value={DEMO_METRICS.satisfactionScore}
                suffix=" / 5.0"
                trend="+0.3 vs last month"
                trendUp
              />
            </div>

            {/* Secondary metrics row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-4 pt-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums text-white">
                      {DEMO_METRICS.avgResponseTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg Response Time
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-1">
                  <div className="mb-3 flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                      <Bot className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums text-white">
                        {DEMO_METRICS.autonomousRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Handled Autonomously
                      </p>
                    </div>
                  </div>
                  <AnimatedProgressBar
                    value={DEMO_METRICS.autonomousRate}
                    max={100}
                    size="sm"
                    variant="gradient"
                    showValue={false}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your AI handled{" "}
                    <span className="font-medium text-emerald-400">
                      {DEMO_METRICS.autonomousRate}%
                    </span>{" "}
                    of inquiries without human intervention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-4 pt-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <Moon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums text-white">
                      {DEMO_METRICS.afterHoursConversations}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      After-Hours Conversations
                    </p>
                    <p className="mt-1 text-xs text-blue-400/80">
                      24/7 availability capturing leads while you sleep
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Over Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Performance Over Time
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Daily conversations and leads captured over the last 30 days
                </p>
              </CardHeader>
              <CardContent>
                <TrendLineChart
                  data={chartData}
                  xKey="date"
                  height={320}
                  series={[
                    {
                      dataKey: "conversations",
                      label: "Conversations",
                      color: SEMANTIC_COLORS.bookings,
                    },
                    {
                      dataKey: "leads",
                      label: "Leads Captured",
                      color: SEMANTIC_COLORS.conversions,
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Conversations Tab ────────────────────────────── */}
        <TabsContent value="conversations">
          <div className="space-y-4">
            {/* Conversation summary strip */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                {conversations.length} recent conversations
              </span>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                {leadsThisMonth} leads captured
              </span>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5 text-amber-400" />
                {
                  conversations.filter((c) => c.status === "transferred")
                    .length
                }{" "}
                transferred
              </span>
            </div>

            {/* Conversation feed */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-white/[0.06]">
                  {conversations.map((conv) => {
                    const isExpanded = expandedConv === conv.id;
                    const statusConfig = STATUS_CONFIG[conv.status];

                    return (
                      <div key={conv.id}>
                        {/* Conversation row */}
                        <button
                          onClick={() =>
                            setExpandedConv(isExpanded ? null : conv.id)
                          }
                          className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-white">
                                {conv.visitorName || "Anonymous Visitor"}
                              </p>
                              {conv.isAfterHours && (
                                <Moon className="h-3 w-3 shrink-0 text-blue-400" />
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {conv.preview}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
                            </Badge>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{conv.messageCount} messages</span>
                              <span className="text-white/10">|</span>
                              <span>{timeAgo(conv.createdAt)}</span>
                            </div>
                          </div>

                          <div className="shrink-0 text-muted-foreground">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </button>

                        {/* Expanded transcript */}
                        {isExpanded && (
                          <div className="border-t border-white/[0.04] bg-white/[0.01] px-5 py-4">
                            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Conversation Transcript
                            </p>
                            <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
                              {conv.transcript.map((msg, idx) => (
                                <div
                                  key={idx}
                                  className={`flex gap-3 ${
                                    msg.role === "assistant"
                                      ? ""
                                      : "flex-row-reverse"
                                  }`}
                                >
                                  <div
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                      msg.role === "assistant"
                                        ? "bg-violet-500/15"
                                        : "bg-white/[0.06]"
                                    }`}
                                  >
                                    {msg.role === "assistant" ? (
                                      <Bot className="h-3.5 w-3.5 text-violet-400" />
                                    ) : (
                                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div
                                    className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                      msg.role === "assistant"
                                        ? "bg-white/[0.04] text-white/90"
                                        : "bg-violet-500/10 text-white/90"
                                    }`}
                                  >
                                    {msg.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {conv.visitorEmail && (
                              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-xs text-emerald-400">
                                <Check className="h-3.5 w-3.5" />
                                Contact info captured: {conv.visitorEmail}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Configuration Tab ────────────────────────────── */}
        <TabsContent value="configuration">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Greeting & Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Chatbot Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Active toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="chatbot-active">Chatbot Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable or disable the chatbot on your website
                      </p>
                    </div>
                    <Switch
                      id="chatbot-active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  {/* Greeting */}
                  <div className="space-y-2">
                    <Label htmlFor="chatbot-greeting">Greeting Message</Label>
                    <Textarea
                      id="chatbot-greeting"
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                      rows={3}
                      placeholder="Enter a greeting message..."
                    />
                    <p className="text-xs text-muted-foreground">
                      First message visitors see when the chatbot opens
                    </p>
                  </div>

                  {/* After-hours toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="after-hours">
                        After-Hours Response
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Keep chatbot active outside business hours
                      </p>
                    </div>
                    <Switch
                      id="after-hours"
                      checked={afterHoursEnabled}
                      onCheckedChange={setAfterHoursEnabled}
                    />
                  </div>

                  {/* Personality tone */}
                  <div className="space-y-3">
                    <Label>Personality Tone</Label>
                    <div className="grid gap-2">
                      {TONE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = tone === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setTone(option.value)}
                            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                              isSelected
                                ? "border-violet-500/40 bg-violet-500/[0.08]"
                                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                isSelected
                                  ? "text-violet-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <div>
                              <p
                                className={`text-sm font-medium ${
                                  isSelected
                                    ? "text-white"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {option.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="ml-auto h-4 w-4 text-violet-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Embed Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Embed Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add this script tag to your website&apos;s HTML to embed
                    the chatbot widget.
                  </p>
                  <div className="relative">
                    <pre className="overflow-x-auto rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-xs leading-relaxed">
                      <code>{embedSnippet}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-2 top-2"
                      onClick={handleCopyEmbed}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Chatbot ID:
                      </span>{" "}
                      <code className="font-mono">{chatbotId}</code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Common Q&A Editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Common Questions & Answers
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Teach your chatbot answers to frequently asked questions
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addQaPair}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Q&A
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qaPairs.map((qa, idx) => (
                    <div
                      key={qa.id}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Question {idx + 1}
                            </Label>
                            <Input
                              value={qa.question}
                              onChange={(e) =>
                                updateQaPair(
                                  qa.id,
                                  "question",
                                  e.target.value
                                )
                              }
                              placeholder="e.g., What are your prices?"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Answer
                            </Label>
                            <Textarea
                              value={qa.answer}
                              onChange={(e) =>
                                updateQaPair(
                                  qa.id,
                                  "answer",
                                  e.target.value
                                )
                              }
                              placeholder="Enter the answer your chatbot should give..."
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeQaPair(qa.id)}
                          className="shrink-0 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {qaPairs.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No Q&A pairs yet. Click &quot;Add Q&A&quot; to teach
                      your chatbot common answers.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Auto-Escalation Rules */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ArrowRightLeft className="h-4 w-4" />
                      Auto-Escalation Rules
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Define when the chatbot should transfer conversations
                      to a human team member
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addEscalationRule}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {escalationRules.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-medium text-amber-400">
                        {idx + 1}
                      </div>
                      <div className="grid flex-1 gap-2 sm:grid-cols-2">
                        <Input
                          value={rule.trigger}
                          onChange={(e) =>
                            updateEscalationRule(
                              rule.id,
                              "trigger",
                              e.target.value
                            )
                          }
                          placeholder="When this happens..."
                          className="text-sm"
                        />
                        <Input
                          value={rule.action}
                          onChange={(e) =>
                            updateEscalationRule(
                              rule.id,
                              "action",
                              e.target.value
                            )
                          }
                          placeholder="Do this..."
                          className="text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeEscalationRule(rule.id)}
                        className="shrink-0 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {escalationRules.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No escalation rules defined. Add rules to control when
                      conversations are transferred to humans.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
