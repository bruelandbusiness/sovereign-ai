"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  Copy,
  Edit3,
  Eye,
  Hash,
  Mail,
  Plus,
  Search,
  Send,
  Smartphone,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Channel = "email" | "sms";
type TemplateCategory =
  | "follow_up"
  | "booking_confirmation"
  | "review_request"
  | "promotion"
  | "estimate"
  | "thank_you";

interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  channel: Channel;
  content: string;
  lastUsed: string;
  usageCount: number;
  openRate: number;
  responseRate: number;
  isPrebuilt: boolean;
}

interface QuickSendState {
  templateId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "follow_up", label: "Follow-ups" },
  { id: "booking_confirmation", label: "Booking Confirmations" },
  { id: "review_request", label: "Review Requests" },
  { id: "promotion", label: "Promotions" },
  { id: "estimate", label: "Estimates" },
  { id: "thank_you", label: "Thank You" },
];

const CATEGORY_CONFIG: Record<
  TemplateCategory,
  { label: string; color: string; bgColor: string }
> = {
  follow_up: {
    label: "Follow-up",
    color: "var(--primary)",
    bgColor: "rgba(76, 133, 255, 0.12)",
  },
  booking_confirmation: {
    label: "Booking",
    color: "var(--success)",
    bgColor: "rgba(34, 211, 161, 0.12)",
  },
  review_request: {
    label: "Review",
    color: "var(--warning)",
    bgColor: "rgba(245, 166, 35, 0.12)",
  },
  promotion: {
    label: "Promo",
    color: "#e879f9",
    bgColor: "rgba(232, 121, 249, 0.12)",
  },
  estimate: {
    label: "Estimate",
    color: "#fb923c",
    bgColor: "rgba(251, 146, 60, 0.12)",
  },
  thank_you: {
    label: "Thank You",
    color: "#34d399",
    bgColor: "rgba(52, 211, 153, 0.12)",
  },
};

const MERGE_FIELDS = [
  { tag: "{{first_name}}", label: "First Name", sample: "Sarah" },
  { tag: "{{last_name}}", label: "Last Name", sample: "Johnson" },
  { tag: "{{business_name}}", label: "Business Name", sample: "Comfort Air HVAC" },
  { tag: "{{appointment_date}}", label: "Appointment Date", sample: "Tuesday, April 8" },
  { tag: "{{appointment_time}}", label: "Appointment Time", sample: "2:00 PM" },
  { tag: "{{service_type}}", label: "Service Type", sample: "AC Tune-Up" },
  { tag: "{{estimate_amount}}", label: "Estimate Amount", sample: "$1,250" },
  { tag: "{{tech_name}}", label: "Technician Name", sample: "Mike R." },
  { tag: "{{review_link}}", label: "Review Link", sample: "https://g.page/review/comfort-air" },
  { tag: "{{phone_number}}", label: "Phone Number", sample: "(555) 234-5678" },
  { tag: "{{coupon_code}}", label: "Coupon Code", sample: "SPRING25" },
  { tag: "{{discount_amount}}", label: "Discount Amount", sample: "25%" },
];

const SMS_SEGMENT_LENGTH = 160;

// ---------------------------------------------------------------------------
// Demo Data — 10 pre-built templates
// ---------------------------------------------------------------------------

const DEMO_TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Post-Service Follow-Up",
    category: "follow_up",
    channel: "email",
    content:
      "Hi {{first_name}},\n\nThank you for choosing {{business_name}} for your recent {{service_type}}. We hope everything is working perfectly!\n\nIf you have any questions or concerns, don't hesitate to reach out at {{phone_number}}.\n\nWarm regards,\n{{business_name}} Team",
    lastUsed: "2026-03-26",
    usageCount: 142,
    openRate: 68.4,
    responseRate: 12.1,
    isPrebuilt: true,
  },
  {
    id: "t2",
    name: "Booking Confirmation",
    category: "booking_confirmation",
    channel: "sms",
    content:
      "Hi {{first_name}}! Your {{service_type}} with {{business_name}} is confirmed for {{appointment_date}} at {{appointment_time}}. Your tech {{tech_name}} will arrive on time. Reply HELP for questions.",
    lastUsed: "2026-03-28",
    usageCount: 312,
    openRate: 97.2,
    responseRate: 4.3,
    isPrebuilt: true,
  },
  {
    id: "t3",
    name: "Review Request After Service",
    category: "review_request",
    channel: "sms",
    content:
      "Hi {{first_name}}, thanks for choosing {{business_name}}! We'd love your feedback. Could you leave us a quick review? {{review_link}} It really helps our small business. Thank you!",
    lastUsed: "2026-03-27",
    usageCount: 256,
    openRate: 95.1,
    responseRate: 31.4,
    isPrebuilt: true,
  },
  {
    id: "t4",
    name: "Seasonal Promotion — Spring AC",
    category: "promotion",
    channel: "email",
    content:
      "Hi {{first_name}},\n\nSpring is here and it's time to get your AC ready! {{business_name}} is offering {{discount_amount}} off all tune-ups this month.\n\nUse code {{coupon_code}} when you book online or mention it when you call {{phone_number}}.\n\nStay cool,\n{{business_name}}",
    lastUsed: "2026-03-20",
    usageCount: 89,
    openRate: 42.7,
    responseRate: 8.9,
    isPrebuilt: true,
  },
  {
    id: "t5",
    name: "Estimate Follow-Up",
    category: "estimate",
    channel: "email",
    content:
      "Hi {{first_name}},\n\nThanks for requesting an estimate from {{business_name}}. Here's a summary:\n\nService: {{service_type}}\nEstimated Cost: {{estimate_amount}}\n\nThis estimate is valid for 30 days. Ready to move forward? Just reply to this email or call us at {{phone_number}}.\n\nBest,\n{{business_name}} Team",
    lastUsed: "2026-03-25",
    usageCount: 178,
    openRate: 72.3,
    responseRate: 24.6,
    isPrebuilt: true,
  },
  {
    id: "t6",
    name: "Thank You — Job Complete",
    category: "thank_you",
    channel: "email",
    content:
      "Hi {{first_name}},\n\nThank you for trusting {{business_name}} with your {{service_type}}! Your technician {{tech_name}} has completed the work.\n\nWe truly appreciate your business. If you know anyone who could use our services, we'd be grateful for the referral.\n\nThank you,\n{{business_name}}",
    lastUsed: "2026-03-27",
    usageCount: 201,
    openRate: 61.8,
    responseRate: 9.2,
    isPrebuilt: true,
  },
  {
    id: "t7",
    name: "Appointment Reminder (24hr)",
    category: "booking_confirmation",
    channel: "sms",
    content:
      "Reminder: {{first_name}}, your {{service_type}} with {{business_name}} is tomorrow, {{appointment_date}} at {{appointment_time}}. {{tech_name}} will be your tech. Reply C to confirm.",
    lastUsed: "2026-03-28",
    usageCount: 487,
    openRate: 98.1,
    responseRate: 62.3,
    isPrebuilt: true,
  },
  {
    id: "t8",
    name: "No-Show Follow-Up",
    category: "follow_up",
    channel: "sms",
    content:
      "Hi {{first_name}}, we missed you today! We'd love to reschedule your {{service_type}} at a time that works better. Call us at {{phone_number}} or reply to this text. —{{business_name}}",
    lastUsed: "2026-03-24",
    usageCount: 34,
    openRate: 91.2,
    responseRate: 44.7,
    isPrebuilt: true,
  },
  {
    id: "t9",
    name: "Referral Thank You",
    category: "thank_you",
    channel: "email",
    content:
      "Hi {{first_name}},\n\nWe just wanted to say a big THANK YOU for referring a friend to {{business_name}}! Word-of-mouth referrals mean the world to us.\n\nAs a token of our appreciation, enjoy {{discount_amount}} off your next service. Use code {{coupon_code}} when you book.\n\nThank you for being part of our family!\n{{business_name}}",
    lastUsed: "2026-03-22",
    usageCount: 67,
    openRate: 74.1,
    responseRate: 18.3,
    isPrebuilt: true,
  },
  {
    id: "t10",
    name: "Estimate Expiring Soon",
    category: "estimate",
    channel: "sms",
    content:
      "Hi {{first_name}}, your {{service_type}} estimate ({{estimate_amount}}) from {{business_name}} expires in 5 days. Ready to book? Call {{phone_number}} or reply YES to schedule.",
    lastUsed: "2026-03-23",
    usageCount: 91,
    openRate: 93.4,
    responseRate: 28.9,
    isPrebuilt: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fillMergeFields(content: string): string {
  let filled = content;
  for (const field of MERGE_FIELDS) {
    filled = filled.replaceAll(field.tag, field.sample);
  }
  return filled;
}

function countSmsSegments(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / SMS_SEGMENT_LENGTH);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function generateId(): string {
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(DEMO_TEMPLATES);
  const [activeCategory, setActiveCategory] = useState<
    TemplateCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editorName, setEditorName] = useState("");
  const [editorChannel, setEditorChannel] = useState<Channel>("email");
  const [editorCategory, setEditorCategory] =
    useState<TemplateCategory>("follow_up");
  const [editorContent, setEditorContent] = useState("");
  const [editorShowPreview, setEditorShowPreview] = useState(false);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick Send state
  const [quickSend, setQuickSend] = useState<QuickSendState | null>(null);
  const [quickSendSent, setQuickSendSent] = useState(false);

  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ---------- Filtering ----------
  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory)
        return false;
      if (channelFilter !== "all" && t.channel !== channelFilter) return false;
      if (
        searchQuery &&
        !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [templates, activeCategory, channelFilter, searchQuery]);

  // ---------- Editor helpers ----------
  function openNewEditor() {
    setEditingTemplate(null);
    setEditorName("");
    setEditorChannel("email");
    setEditorCategory("follow_up");
    setEditorContent("");
    setEditorShowPreview(false);
    setEditorOpen(true);
  }

  function openEditEditor(t: Template) {
    setEditingTemplate(t);
    setEditorName(t.name);
    setEditorChannel(t.channel);
    setEditorCategory(t.category);
    setEditorContent(t.content);
    setEditorShowPreview(false);
    setEditorOpen(true);
  }

  function saveTemplate() {
    if (!editorName.trim() || !editorContent.trim()) return;

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: editorName.trim(),
                channel: editorChannel,
                category: editorCategory,
                content: editorContent,
              }
            : t,
        ),
      );
    } else {
      const newTemplate: Template = {
        id: generateId(),
        name: editorName.trim(),
        channel: editorChannel,
        category: editorCategory,
        content: editorContent,
        lastUsed: "2026-03-28",
        usageCount: 0,
        openRate: 0,
        responseRate: 0,
        isPrebuilt: false,
      };
      setTemplates((prev) => [newTemplate, ...prev]);
    }
    setEditorOpen(false);
  }

  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function duplicateTemplate(t: Template) {
    const dup: Template = {
      ...t,
      id: generateId(),
      name: `${t.name} (Copy)`,
      usageCount: 0,
      openRate: 0,
      responseRate: 0,
      isPrebuilt: false,
    };
    setTemplates((prev) => [dup, ...prev]);
  }

  const insertMergeField = useCallback(
    (tag: string) => {
      const ta = editorTextareaRef.current;
      if (!ta) {
        setEditorContent((prev) => prev + tag);
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = editorContent.slice(0, start);
      const after = editorContent.slice(end);
      const updated = before + tag + after;
      setEditorContent(updated);
      requestAnimationFrame(() => {
        ta.focus();
        const newPos = start + tag.length;
        ta.setSelectionRange(newPos, newPos);
      });
    },
    [editorContent],
  );

  // Quick Send helpers
  function openQuickSend(templateId: string) {
    setQuickSend({
      templateId,
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    });
    setQuickSendSent(false);
  }

  function sendQuickMessage() {
    setQuickSendSent(true);
    const tId = quickSend?.templateId;
    if (tId) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === tId
            ? { ...t, usageCount: t.usageCount + 1, lastUsed: "2026-03-28" }
            : t,
        ),
      );
    }
    setTimeout(() => {
      setQuickSend(null);
      setQuickSendSent(false);
    }, 2000);
  }

  function handleCopy(t: Template) {
    navigator.clipboard.writeText(t.content).catch(() => {});
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Escape to close modals
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editorOpen) setEditorOpen(false);
        if (quickSend) {
          setQuickSend(null);
          setQuickSendSent(false);
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [editorOpen, quickSend]);

  // Stats
  const totalTemplates = templates.length;
  const avgOpenRate =
    templates.length > 0
      ? templates.reduce((s, t) => s + t.openRate, 0) / templates.length
      : 0;
  const avgResponseRate =
    templates.length > 0
      ? templates.reduce((s, t) => s + t.responseRate, 0) / templates.length
      : 0;
  const totalSent = templates.reduce((s, t) => s + t.usageCount, 0);

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          {/* Page Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Message Templates
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage Email and SMS templates for your home service
                business.
              </p>
            </div>
            <Button size="sm" onClick={openNewEditor}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Template
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <BookOpen className="h-3.5 w-3.5" />
                Templates
              </div>
              <div className="text-xl font-bold">{totalTemplates}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Send className="h-3.5 w-3.5" />
                Total Sent
              </div>
              <div className="text-xl font-bold">
                {totalSent.toLocaleString()}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Eye className="h-3.5 w-3.5" />
                Avg Open Rate
              </div>
              <div className="text-xl font-bold">{avgOpenRate.toFixed(1)}%</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Avg Response
              </div>
              <div className="text-xl font-bold">
                {avgResponseRate.toFixed(1)}%
              </div>
            </Card>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 flex-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activeCategory === cat.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-white/[0.06]",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Channel filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChannelFilter("all")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  channelFilter === "all"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/[0.06]",
                )}
              >
                All
              </button>
              <button
                onClick={() => setChannelFilter("email")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1",
                  channelFilter === "email"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/[0.06]",
                )}
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>
              <button
                onClick={() => setChannelFilter("sms")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1",
                  channelFilter === "sms"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/[0.06]",
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                SMS
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground mb-4">
                No templates match your filters.
              </p>
              <Button variant="secondary" size="sm" onClick={openNewEditor}>
                <Plus className="mr-1.5 h-4 w-4" />
                Create a Template
              </Button>
            </div>
          )}

          {/* Template Cards Grid */}
          {filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => {
                const catConfig = CATEGORY_CONFIG[t.category];
                const preview = t.content.slice(0, 100) + (t.content.length > 100 ? "..." : "");

                return (
                  <Card key={t.id} className="flex flex-col">
                    <CardContent className="p-5 flex-1 flex flex-col">
                      {/* Top row: category + channel + star */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: catConfig.bgColor,
                              color: catConfig.color,
                            }}
                          >
                            {catConfig.label}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                              t.channel === "email"
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-green-500/10 text-green-400",
                            )}
                          >
                            {t.channel === "email" ? (
                              <Mail className="h-2.5 w-2.5" />
                            ) : (
                              <Smartphone className="h-2.5 w-2.5" />
                            )}
                            {t.channel === "email" ? "Email" : "SMS"}
                          </span>
                        </div>
                        {t.isPrebuilt && (
                          <Star
                            className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0"
                            aria-label="Pre-built template"
                          />
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-sm font-semibold text-foreground mb-1.5">
                        {t.name}
                      </h3>

                      {/* Preview snippet */}
                      <p className="text-xs text-muted-foreground mb-3 flex-1 line-clamp-3 leading-relaxed">
                        {preview}
                      </p>

                      {/* Performance stats */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3 border-t border-border pt-3">
                        <span
                          className="flex items-center gap-1"
                          title="Last used"
                        >
                          <Clock className="h-3 w-3" />
                          {formatDate(t.lastUsed)}
                        </span>
                        <span
                          className="flex items-center gap-1"
                          title="Times used"
                        >
                          <Hash className="h-3 w-3" />
                          {t.usageCount} sent
                        </span>
                        <span
                          className="flex items-center gap-1"
                          title="Open rate"
                        >
                          <Eye className="h-3 w-3" />
                          {t.openRate}%
                        </span>
                        <span
                          className="flex items-center gap-1"
                          title="Response rate"
                        >
                          <TrendingUp className="h-3 w-3" />
                          {t.responseRate}%
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditEditor(t)}
                          className="text-xs px-2"
                        >
                          <Edit3 className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(t)}
                          className="text-xs px-2"
                        >
                          {copiedId === t.id ? (
                            <Check className="mr-1 h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="mr-1 h-3 w-3" />
                          )}
                          {copiedId === t.id ? "Copied" : "Copy"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateTemplate(t)}
                          className="text-xs px-2"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Dup
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openQuickSend(t.id)}
                          className="text-xs px-2 ml-auto flex-shrink-0"
                        >
                          <Send className="mr-1 h-3 w-3" />
                          Send
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </main>

      {/* ----------------------------------------------------------------- */}
      {/* Template Editor Modal                                              */}
      {/* ----------------------------------------------------------------- */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={
            editingTemplate ? `Edit: ${editingTemplate.name}` : "New Template"
          }
        >
          <div className="relative w-full max-w-4xl my-8 rounded-xl border border-border bg-secondary">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold">
                {editingTemplate ? "Edit Template" : "New Template"}
              </h2>
              <div className="flex items-center gap-2">
                {editingTemplate && !editingTemplate.isPrebuilt && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      deleteTemplate(editingTemplate.id);
                      setEditorOpen(false);
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
                <button
                  onClick={() => setEditorOpen(false)}
                  aria-label="Close editor"
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Top fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {/* Name */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Template Name
                  </label>
                  <Input
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value)}
                    placeholder="e.g. Follow-Up After Service"
                  />
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Channel
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditorChannel("email")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        editorChannel === "email"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                    <button
                      onClick={() => setEditorChannel("sms")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        editorChannel === "sms"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      <Smartphone className="h-4 w-4" />
                      SMS
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Category
                  </label>
                  <select
                    value={editorCategory}
                    onChange={(e) =>
                      setEditorCategory(e.target.value as TemplateCategory)
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    style={{ borderRadius: "var(--radius, 8px)" }}
                  >
                    {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Merge Field Buttons */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Insert Merge Field
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MERGE_FIELDS.map((f) => (
                    <button
                      key={f.tag}
                      onClick={() => insertMergeField(f.tag)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                      title={`Inserts ${f.tag} — e.g. "${f.sample}"`}
                    >
                      <Tag className="inline h-2.5 w-2.5 mr-0.5" />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content + Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Content
                    </label>
                    {editorChannel === "sms" && (
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          editorContent.length > SMS_SEGMENT_LENGTH
                            ? "text-amber-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {editorContent.length} chars &middot;{" "}
                        {countSmsSegments(editorContent)} segment
                        {countSmsSegments(editorContent) !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <textarea
                    ref={editorTextareaRef}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="Type your message here. Use merge fields above to personalize."
                    rows={12}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    style={{ borderRadius: "var(--radius, 8px)" }}
                  />
                  {editorChannel === "sms" &&
                    countSmsSegments(editorContent) > 1 && (
                      <p className="text-[11px] text-amber-400 mt-1">
                        This message will be sent as{" "}
                        {countSmsSegments(editorContent)} SMS segments. Keeping
                        it under {SMS_SEGMENT_LENGTH} characters saves cost.
                      </p>
                    )}
                </div>

                {/* Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Preview (with sample data)
                    </label>
                    <button
                      onClick={() => setEditorShowPreview(!editorShowPreview)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      {editorShowPreview ? "Hide" : "Show"} Preview
                    </button>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border border-border bg-background p-4 min-h-[280px]",
                      !editorShowPreview && "lg:block",
                    )}
                    style={{ borderRadius: "var(--radius, 8px)" }}
                  >
                    {editorContent ? (
                      editorChannel === "email" ? (
                        // Email preview
                        <div>
                          <div className="border-b border-border pb-3 mb-3">
                            <p className="text-[11px] text-muted-foreground">
                              From: {MERGE_FIELDS.find((f) => f.tag === "{{business_name}}")?.sample}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              To: {MERGE_FIELDS.find((f) => f.tag === "{{first_name}}")?.sample}{" "}
                              {MERGE_FIELDS.find((f) => f.tag === "{{last_name}}")?.sample}
                            </p>
                          </div>
                          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                            {fillMergeFields(editorContent)}
                          </div>
                        </div>
                      ) : (
                        // SMS preview — phone bubble
                        <div className="flex flex-col items-center">
                          <div className="w-full max-w-[280px]">
                            <div className="text-center text-[10px] text-muted-foreground mb-3">
                              SMS Preview
                            </div>
                            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3">
                              <p className="text-sm text-foreground leading-relaxed">
                                {fillMergeFields(editorContent)}
                              </p>
                            </div>
                            <div className="text-right text-[10px] text-muted-foreground mt-1">
                              {fillMergeFields(editorContent).length} chars
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground opacity-50">
                        Start typing to see the preview
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditorOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveTemplate}
                  disabled={!editorName.trim() || !editorContent.trim()}
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  {editingTemplate ? "Save Changes" : "Create Template"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Quick Send Modal                                                   */}
      {/* ----------------------------------------------------------------- */}
      {quickSend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Send"
        >
          <div className="relative w-full max-w-md rounded-xl border border-border bg-secondary p-6">
            <button
              onClick={() => {
                setQuickSend(null);
                setQuickSendSent(false);
              }}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {(() => {
              const tpl = templates.find(
                (t) => t.id === quickSend.templateId,
              );
              if (!tpl) return null;
              return (
                <>
                  <h2 className="text-lg font-bold mb-1 pr-8">Quick Send</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send &ldquo;{tpl.name}&rdquo; via{" "}
                    {tpl.channel === "email" ? "Email" : "SMS"}
                  </p>

                  {quickSendSent ? (
                    <div className="flex flex-col items-center py-8">
                      <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                        <Check className="h-6 w-6 text-green-400" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Message sent successfully!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Contact Name
                          </label>
                          <Input
                            value={quickSend.contactName}
                            onChange={(e) =>
                              setQuickSend({
                                ...quickSend,
                                contactName: e.target.value,
                              })
                            }
                            placeholder="Sarah Johnson"
                          />
                        </div>
                        {tpl.channel === "email" ? (
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Email Address
                            </label>
                            <Input
                              type="email"
                              value={quickSend.contactEmail}
                              onChange={(e) =>
                                setQuickSend({
                                  ...quickSend,
                                  contactEmail: e.target.value,
                                })
                              }
                              placeholder="sarah@example.com"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Phone Number
                            </label>
                            <Input
                              type="tel"
                              value={quickSend.contactPhone}
                              onChange={(e) =>
                                setQuickSend({
                                  ...quickSend,
                                  contactPhone: e.target.value,
                                })
                              }
                              placeholder="(555) 123-4567"
                            />
                          </div>
                        )}
                      </div>

                      {/* Message preview */}
                      <div className="rounded-lg border border-border bg-background p-3 mb-4">
                        <p className="text-[11px] text-muted-foreground mb-1 font-medium">
                          Message Preview
                        </p>
                        <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">
                          {fillMergeFields(tpl.content)}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setQuickSend(null);
                            setQuickSendSent(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={sendQuickMessage}
                          disabled={
                            !quickSend.contactName.trim() ||
                            (tpl.channel === "email"
                              ? !quickSend.contactEmail.trim()
                              : !quickSend.contactPhone.trim())
                          }
                        >
                          <Send className="mr-1.5 h-4 w-4" />
                          Send{" "}
                          {tpl.channel === "email" ? "Email" : "SMS"}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
