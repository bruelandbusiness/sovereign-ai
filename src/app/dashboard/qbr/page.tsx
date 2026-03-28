"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Lightbulb,
  Minus,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuarterMetrics {
  leads: number;
  revenue: number;
  conversions: number;
  roi: number;
  adSpend: number;
  impressions: number;
  clicks: number;
  chatbotConversations: number;
  reviewsCollected: number;
  contentPublished: number;
  costPerLead: number;
}

interface QuarterGoal {
  label: string;
  target: number;
  achieved: number;
  unit: string;
}

interface ServiceImpact {
  name: string;
  icon: "search" | "chat" | "ads" | "content" | "social";
  contribution: string;
  metrics: { label: string; value: string }[];
}

interface Recommendation {
  title: string;
  description: string;
  impactEstimate: string;
  priority: "high" | "medium" | "low";
}

interface QBRData {
  id: string;
  quarter: string;
  dateRange: string;
  grade: string;
  gradeColor: string;
  summary: string;
  highlights: string[];
  current: QuarterMetrics;
  previous: QuarterMetrics;
  goals: QuarterGoal[];
  services: ServiceImpact[];
  recommendations: Recommendation[];
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

const DEMO_QBRS: QBRData[] = [
  {
    id: "q1-2026",
    quarter: "Q1 2026",
    dateRange: "Jan 1 – Mar 31, 2026",
    grade: "A",
    gradeColor: "text-emerald-400",
    summary:
      "Strong quarter with 23% lead growth and record conversion rates. AI-powered chatbot drove significant pipeline acceleration while content marketing expanded organic reach by 41%.",
    highlights: [
      "Leads surpassed 1,200 for the first time, a 23% increase QoQ",
      "Conversion rate climbed to 4.8%, beating the 4.5% target",
      "AI chatbot handled 3,400+ conversations, deflecting 68% of support tickets",
      "Published 42 AI-optimized blog posts, growing organic traffic 41%",
      "Google Ads ROAS improved from 3.2x to 4.1x after bid strategy overhaul",
    ],
    current: {
      leads: 1247,
      revenue: 18450000,
      conversions: 60,
      roi: 312,
      adSpend: 4500000,
      impressions: 892000,
      clicks: 34500,
      chatbotConversations: 3420,
      reviewsCollected: 187,
      contentPublished: 42,
      costPerLead: 3607,
    },
    previous: {
      leads: 1014,
      revenue: 14200000,
      conversions: 44,
      roi: 248,
      adSpend: 4100000,
      impressions: 745000,
      clicks: 28900,
      chatbotConversations: 2810,
      reviewsCollected: 142,
      contentPublished: 31,
      costPerLead: 4043,
    },
    goals: [
      { label: "Qualified Leads", target: 1200, achieved: 1247, unit: "" },
      {
        label: "Revenue",
        target: 17500000,
        achieved: 18450000,
        unit: "currency",
      },
      { label: "Conversion Rate", target: 4.5, achieved: 4.8, unit: "%" },
      { label: "Google Reviews", target: 200, achieved: 187, unit: "" },
      { label: "Content Pieces", target: 40, achieved: 42, unit: "" },
    ],
    services: [
      {
        name: "AI Search Optimization",
        icon: "search",
        contribution: "34% of total leads",
        metrics: [
          { label: "Organic Sessions", value: "48,200" },
          { label: "Keywords in Top 10", value: "312" },
          { label: "Featured Snippets", value: "28" },
        ],
      },
      {
        name: "AI Chatbot",
        icon: "chat",
        contribution: "22% of conversions",
        metrics: [
          { label: "Conversations", value: "3,420" },
          { label: "Lead Captures", value: "274" },
          { label: "Avg Response Time", value: "1.2s" },
        ],
      },
      {
        name: "Paid Advertising",
        icon: "ads",
        contribution: "41% of total leads",
        metrics: [
          { label: "Ad Spend", value: "$45,000" },
          { label: "ROAS", value: "4.1x" },
          { label: "Cost per Lead", value: "$36" },
        ],
      },
      {
        name: "Content Marketing",
        icon: "content",
        contribution: "18% of organic growth",
        metrics: [
          { label: "Articles Published", value: "42" },
          { label: "Avg Time on Page", value: "4m 12s" },
          { label: "Backlinks Earned", value: "89" },
        ],
      },
      {
        name: "Reputation Management",
        icon: "social",
        contribution: "12% lift in trust signals",
        metrics: [
          { label: "Reviews Collected", value: "187" },
          { label: "Avg Rating", value: "4.8" },
          { label: "Response Rate", value: "97%" },
        ],
      },
    ],
    recommendations: [
      {
        title: "Scale AI chatbot to after-hours coverage",
        description:
          "27% of website visitors arrive between 7 PM and 7 AM. Enabling 24/7 chatbot coverage could capture an estimated 80+ additional leads per quarter.",
        impactEstimate: "+80 leads/quarter",
        priority: "high",
      },
      {
        title: "Launch video content strategy",
        description:
          "Competitors in your vertical are seeing 3x engagement on video vs. written content. A 4-video/month cadence is projected to increase organic reach by 25%.",
        impactEstimate: "+25% organic reach",
        priority: "high",
      },
      {
        title: "Expand remarketing audiences",
        description:
          "Current remarketing lists cover only 40% of site visitors. Broadening audience segments and adding lookalike campaigns can improve ROAS by 0.5x.",
        impactEstimate: "+0.5x ROAS",
        priority: "medium",
      },
      {
        title: "Implement review response automation",
        description:
          "Automating review responses within 2 hours has shown a 15% increase in review volume for similar businesses. Currently at 97% response rate but 18-hour avg response time.",
        impactEstimate: "+30 reviews/quarter",
        priority: "medium",
      },
      {
        title: "A/B test landing page variations",
        description:
          "The main service landing page has a 3.1% conversion rate. Testing hero copy, CTA placement, and social proof positioning could lift conversions by 0.5–1%.",
        impactEstimate: "+0.5-1% conversion rate",
        priority: "low",
      },
    ],
  },
  {
    id: "q4-2025",
    quarter: "Q4 2025",
    dateRange: "Oct 1 – Dec 31, 2025",
    grade: "B+",
    gradeColor: "text-blue-400",
    summary:
      "Solid quarter with steady growth despite seasonal slowdown. Chatbot launch in November was the highlight, immediately improving lead response times. Revenue grew 11% QoQ.",
    highlights: [
      "Revenue crossed $142K, up 11% from Q3",
      "AI chatbot launched mid-November, capturing 2,810 conversations in 6 weeks",
      "Google Ads CPC dropped 8% through automated bid optimization",
      "Published first long-form pillar content, generating 31 backlinks",
    ],
    current: {
      leads: 1014,
      revenue: 14200000,
      conversions: 44,
      roi: 248,
      adSpend: 4100000,
      impressions: 745000,
      clicks: 28900,
      chatbotConversations: 2810,
      reviewsCollected: 142,
      contentPublished: 31,
      costPerLead: 4043,
    },
    previous: {
      leads: 870,
      revenue: 12800000,
      conversions: 37,
      roi: 215,
      adSpend: 3800000,
      impressions: 620000,
      clicks: 24100,
      chatbotConversations: 0,
      reviewsCollected: 108,
      contentPublished: 24,
      costPerLead: 4368,
    },
    goals: [
      { label: "Qualified Leads", target: 1100, achieved: 1014, unit: "" },
      {
        label: "Revenue",
        target: 15000000,
        achieved: 14200000,
        unit: "currency",
      },
      { label: "Conversion Rate", target: 4.5, achieved: 4.3, unit: "%" },
      { label: "Google Reviews", target: 150, achieved: 142, unit: "" },
      { label: "Content Pieces", target: 30, achieved: 31, unit: "" },
    ],
    services: [
      {
        name: "AI Search Optimization",
        icon: "search",
        contribution: "30% of total leads",
        metrics: [
          { label: "Organic Sessions", value: "38,400" },
          { label: "Keywords in Top 10", value: "267" },
          { label: "Featured Snippets", value: "19" },
        ],
      },
      {
        name: "AI Chatbot",
        icon: "chat",
        contribution: "15% of conversions",
        metrics: [
          { label: "Conversations", value: "2,810" },
          { label: "Lead Captures", value: "198" },
          { label: "Avg Response Time", value: "1.4s" },
        ],
      },
      {
        name: "Paid Advertising",
        icon: "ads",
        contribution: "45% of total leads",
        metrics: [
          { label: "Ad Spend", value: "$41,000" },
          { label: "ROAS", value: "3.2x" },
          { label: "Cost per Lead", value: "$40" },
        ],
      },
      {
        name: "Content Marketing",
        icon: "content",
        contribution: "14% of organic growth",
        metrics: [
          { label: "Articles Published", value: "31" },
          { label: "Avg Time on Page", value: "3m 48s" },
          { label: "Backlinks Earned", value: "54" },
        ],
      },
      {
        name: "Reputation Management",
        icon: "social",
        contribution: "9% lift in trust signals",
        metrics: [
          { label: "Reviews Collected", value: "142" },
          { label: "Avg Rating", value: "4.7" },
          { label: "Response Rate", value: "94%" },
        ],
      },
    ],
    recommendations: [
      {
        title: "Increase chatbot coverage hours",
        description:
          "The chatbot launched mid-quarter. Expanding it to full 24/7 coverage will maximize lead capture from off-hours traffic.",
        impactEstimate: "+120 leads/quarter",
        priority: "high",
      },
      {
        title: "Invest in holiday-season ad campaigns",
        description:
          "Seasonal demand was underutilized. Pre-planning Q4 campaigns 6 weeks early could capture 15% more seasonal traffic.",
        impactEstimate: "+15% seasonal leads",
        priority: "medium",
      },
      {
        title: "Optimize Google Business Profile",
        description:
          "Profile completeness is at 78%. Reaching 100% with photos, Q&A, and service areas can boost local pack visibility by 20%.",
        impactEstimate: "+20% local visibility",
        priority: "medium",
      },
    ],
  },
  {
    id: "q3-2025",
    quarter: "Q3 2025",
    dateRange: "Jul 1 – Sep 30, 2025",
    grade: "B",
    gradeColor: "text-blue-400",
    summary:
      "Foundation-building quarter. SEO and content strategies began showing traction with organic traffic up 28%. Paid campaigns stabilized with consistent lead flow.",
    highlights: [
      "Organic traffic grew 28% as SEO investments matured",
      "Content library reached 80+ articles across key service areas",
      "Paid ad efficiency improved with new negative keyword strategy",
      "First 100+ review milestone reached on Google",
    ],
    current: {
      leads: 870,
      revenue: 12800000,
      conversions: 37,
      roi: 215,
      adSpend: 3800000,
      impressions: 620000,
      clicks: 24100,
      chatbotConversations: 0,
      reviewsCollected: 108,
      contentPublished: 24,
      costPerLead: 4368,
    },
    previous: {
      leads: 710,
      revenue: 10500000,
      conversions: 28,
      roi: 178,
      adSpend: 3500000,
      impressions: 510000,
      clicks: 19800,
      chatbotConversations: 0,
      reviewsCollected: 76,
      contentPublished: 18,
      costPerLead: 4930,
    },
    goals: [
      { label: "Qualified Leads", target: 900, achieved: 870, unit: "" },
      {
        label: "Revenue",
        target: 13000000,
        achieved: 12800000,
        unit: "currency",
      },
      { label: "Conversion Rate", target: 4.0, achieved: 4.3, unit: "%" },
      { label: "Google Reviews", target: 100, achieved: 108, unit: "" },
      { label: "Content Pieces", target: 25, achieved: 24, unit: "" },
    ],
    services: [
      {
        name: "AI Search Optimization",
        icon: "search",
        contribution: "28% of total leads",
        metrics: [
          { label: "Organic Sessions", value: "31,200" },
          { label: "Keywords in Top 10", value: "198" },
          { label: "Featured Snippets", value: "12" },
        ],
      },
      {
        name: "Paid Advertising",
        icon: "ads",
        contribution: "52% of total leads",
        metrics: [
          { label: "Ad Spend", value: "$38,000" },
          { label: "ROAS", value: "2.8x" },
          { label: "Cost per Lead", value: "$44" },
        ],
      },
      {
        name: "Content Marketing",
        icon: "content",
        contribution: "12% of organic growth",
        metrics: [
          { label: "Articles Published", value: "24" },
          { label: "Avg Time on Page", value: "3m 22s" },
          { label: "Backlinks Earned", value: "38" },
        ],
      },
      {
        name: "Reputation Management",
        icon: "social",
        contribution: "8% lift in trust signals",
        metrics: [
          { label: "Reviews Collected", value: "108" },
          { label: "Avg Rating", value: "4.6" },
          { label: "Response Rate", value: "89%" },
        ],
      },
    ],
    recommendations: [
      {
        title: "Deploy AI chatbot for lead capture",
        description:
          "Website has growing traffic but no real-time engagement tool. An AI chatbot can convert 5-8% of visitors into leads.",
        impactEstimate: "+150 leads/quarter",
        priority: "high",
      },
      {
        title: "Increase content publishing cadence",
        description:
          "Moving from 24 to 35+ articles per quarter will accelerate the organic traffic growth trajectory.",
        impactEstimate: "+35% organic traffic",
        priority: "medium",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function ChangeIndicator({
  current,
  previous,
  invert = false,
}: {
  current: number;
  previous: number;
  invert?: boolean;
}) {
  const change = pctChange(current, previous);
  const isPositive = invert ? change < 0 : change > 0;
  const isNeutral = change === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" aria-hidden="true" />
        0%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {change > 0 ? (
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ArrowDown className="h-3 w-3" aria-hidden="true" />
      )}
      {Math.abs(change)}%
    </span>
  );
}

function ProgressBar({
  achieved,
  target,
  unit,
}: {
  achieved: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min((achieved / target) * 100, 100);
  const overTarget = achieved >= target;

  function formatVal(v: number): string {
    if (unit === "currency") return formatCurrency(v);
    if (unit === "%") return `${v}%`;
    return v.toLocaleString();
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {formatVal(achieved)} / {formatVal(target)}
        </span>
        {overTarget ? (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Achieved
          </span>
        ) : (
          <span className="text-muted-foreground">{Math.round(pct)}%</span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            overTarget ? "bg-emerald-500" : pct >= 80 ? "bg-blue-500" : "bg-amber-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const SERVICE_ICONS: Record<string, typeof BarChart3> = {
  search: Target,
  chat: Sparkles,
  ads: Zap,
  content: BarChart3,
  social: TrendingUp,
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QBRPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = DEMO_QBRS.find((q) => q.id === selectedId) ?? null;

  function handleDownloadPdf() {
    window.print();
  }

  return (
    <>
      {/* Print-optimized styles */}
      <style>{`
        @media print {
          header, footer, nav,
          [data-print-hide] {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-background { background: white !important; }
          .text-foreground, .text-primary, .text-emerald-400,
          .text-blue-400, .text-amber-400 {
            color: #111 !important;
          }
          .text-muted-foreground { color: #555 !important; }
          .border-white\\/\\[0\\.06\\],
          .border-primary\\/20 {
            border-color: #ddd !important;
          }
          [class*="bg-primary/5"],
          [class*="bg-muted"] {
            background: #f5f5f5 !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          main { padding: 0 !important; }
          @page {
            margin: 0.75in;
            size: letter;
          }
        }
      `}</style>

      <div className="flex min-h-screen flex-col bg-background page-enter">
        <Header variant="minimal" />

        <main className="flex-1 py-8" aria-label="Quarterly business reviews">
          <Container>
            {/* Page Header */}
            <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Link href="/dashboard" aria-label="Back to dashboard" data-print-hide>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
                    Quarterly Business Reviews
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-generated quarterly performance analysis and strategic recommendations.
                  </p>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* Detail View */}
            {/* --------------------------------------------------------------- */}
            {selected !== null ? (
              <div className="space-y-6">
                {/* Nav bar */}
                <div
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  data-print-hide
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedId(null)}
                    aria-label="Back to report list"
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    All Reports
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPdf}
                    aria-label={`Download ${selected.quarter} report as PDF`}
                  >
                    <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Download PDF
                  </Button>
                </div>

                {/* 1. Executive Summary Card */}
                <Card className="border-primary/20 bg-primary/5 print:break-inside-avoid">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                          <Badge variant="default">{selected.quarter}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {selected.dateRange}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">
                          Quarterly Business Review
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selected.summary}
                        </p>
                        <ul className="mt-4 space-y-1.5">
                          {selected.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span
                                className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="text-muted-foreground">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-background/50 px-6 py-4 shrink-0">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Grade
                        </span>
                        <span className={`text-4xl font-black ${selected.gradeColor}`}>
                          {selected.grade}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Quarter vs Quarter Comparison */}
                <Card className="border-white/[0.06] print:break-inside-avoid">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
                      <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
                      Quarter-over-Quarter Comparison
                    </h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {/* Leads */}
                      <div className="rounded-lg border border-white/[0.06] p-4">
                        <p className="text-xs text-muted-foreground mb-1">Leads</p>
                        <p className="text-xl font-bold text-foreground">
                          {selected.current.leads.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            vs {selected.previous.leads.toLocaleString()}
                          </span>
                          <ChangeIndicator
                            current={selected.current.leads}
                            previous={selected.previous.leads}
                          />
                        </div>
                      </div>
                      {/* Revenue */}
                      <div className="rounded-lg border border-white/[0.06] p-4">
                        <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                        <p className="text-xl font-bold text-emerald-400">
                          {formatCurrency(selected.current.revenue)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            vs {formatCurrency(selected.previous.revenue)}
                          </span>
                          <ChangeIndicator
                            current={selected.current.revenue}
                            previous={selected.previous.revenue}
                          />
                        </div>
                      </div>
                      {/* Conversions */}
                      <div className="rounded-lg border border-white/[0.06] p-4">
                        <p className="text-xs text-muted-foreground mb-1">Conversions</p>
                        <p className="text-xl font-bold text-blue-400">
                          {selected.current.conversions}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            vs {selected.previous.conversions}
                          </span>
                          <ChangeIndicator
                            current={selected.current.conversions}
                            previous={selected.previous.conversions}
                          />
                        </div>
                      </div>
                      {/* ROI */}
                      <div className="rounded-lg border border-white/[0.06] p-4">
                        <p className="text-xs text-muted-foreground mb-1">ROI</p>
                        <p className="text-xl font-bold text-amber-400">
                          {selected.current.roi}%
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            vs {selected.previous.roi}%
                          </span>
                          <ChangeIndicator
                            current={selected.current.roi}
                            previous={selected.previous.roi}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Goal Achievement */}
                <Card className="border-white/[0.06] print:break-inside-avoid">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
                      <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                      Goal Achievement
                    </h3>
                    <div className="space-y-5">
                      {selected.goals.map((goal, i) => (
                        <div key={i}>
                          <p className="text-sm font-medium text-foreground mb-1">
                            {goal.label}
                          </p>
                          <ProgressBar
                            achieved={goal.achieved}
                            target={goal.target}
                            unit={goal.unit}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Service Impact Breakdown */}
                <Card className="border-white/[0.06] print:break-inside-avoid">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
                      <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                      Service Impact Breakdown
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {selected.services.map((svc, i) => {
                        const Icon = SERVICE_ICONS[svc.icon] ?? BarChart3;
                        return (
                          <div
                            key={i}
                            className="rounded-lg border border-white/[0.06] p-4 space-y-3"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {svc.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {svc.contribution}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {svc.metrics.map((m, j) => (
                                <div key={j} className="text-center">
                                  <p className="text-sm font-bold text-foreground">
                                    {m.value}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground leading-tight">
                                    {m.label}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Strategic Recommendations */}
                <Card className="border-white/[0.06] print:break-inside-avoid">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
                      <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
                      Strategic Recommendations for Next Quarter
                    </h3>
                    <div className="space-y-4">
                      {selected.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-white/[0.06] p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">
                              {rec.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-[10px] uppercase ${
                                PRIORITY_STYLES[rec.priority]
                              }`}
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {rec.description}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp
                              className="h-3 w-3 text-emerald-400"
                              aria-hidden="true"
                            />
                            <span className="text-xs font-medium text-emerald-400">
                              Est. Impact: {rec.impactEstimate}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Performance Metrics */}
                <Card className="border-white/[0.06] print:break-inside-avoid">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      Additional Performance Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(selected.current.adSpend)}
                        </p>
                        <p className="text-xs text-muted-foreground">Ad Spend</p>
                        <ChangeIndicator
                          current={selected.current.adSpend}
                          previous={selected.previous.adSpend}
                          invert
                        />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {selected.current.impressions.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Impressions</p>
                        <ChangeIndicator
                          current={selected.current.impressions}
                          previous={selected.previous.impressions}
                        />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {selected.current.clicks.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <ChangeIndicator
                          current={selected.current.clicks}
                          previous={selected.previous.clicks}
                        />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {selected.current.chatbotConversations.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Chatbot Convos</p>
                        <ChangeIndicator
                          current={selected.current.chatbotConversations}
                          previous={selected.previous.chatbotConversations}
                        />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(selected.current.costPerLead)}
                        </p>
                        <p className="text-xs text-muted-foreground">Cost per Lead</p>
                        <ChangeIndicator
                          current={selected.current.costPerLead}
                          previous={selected.previous.costPerLead}
                          invert
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* --------------------------------------------------------------- */
              /* 7. Historical QBR List                                           */
              /* --------------------------------------------------------------- */
              <div className="space-y-4" role="list" aria-label="Quarterly business reviews">
                {DEMO_QBRS.map((qbr) => {
                  const _leadsChange = pctChange(
                    qbr.current.leads,
                    qbr.previous.leads,
                  );
                  const _revenueChange = pctChange(
                    qbr.current.revenue,
                    qbr.previous.revenue,
                  );
                  const goalsHit = qbr.goals.filter(
                    (g) => g.achieved >= g.target,
                  ).length;

                  return (
                    <Card
                      key={qbr.id}
                      role="listitem"
                      tabIndex={0}
                      className="border-white/[0.06] cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => setSelectedId(qbr.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(qbr.id);
                        }
                      }}
                      aria-label={`View ${qbr.quarter} quarterly review`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="font-semibold">
                                {qbr.quarter}
                              </Badge>
                              <span
                                className={`text-lg font-black ${qbr.gradeColor}`}
                              >
                                {qbr.grade}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {qbr.dateRange}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {qbr.summary}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs">
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                Leads: {qbr.current.leads.toLocaleString()}
                                <ChangeIndicator
                                  current={qbr.current.leads}
                                  previous={qbr.previous.leads}
                                />
                              </span>
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                Revenue: {formatCurrency(qbr.current.revenue)}
                                <ChangeIndicator
                                  current={qbr.current.revenue}
                                  previous={qbr.previous.revenue}
                                />
                              </span>
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                Goals: {goalsHit}/{qbr.goals.length} hit
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            className="h-5 w-5 text-muted-foreground shrink-0 mt-1"
                            aria-hidden="true"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </Container>
        </main>

        <Footer />
      </div>
    </>
  );
}
