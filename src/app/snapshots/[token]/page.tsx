"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Info,
  Loader2,
  Search,
  Share2,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Finding {
  area: string;
  severity: "critical" | "warning" | "info";
  message: string;
}

interface SnapshotData {
  businessName: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  vertical: string | null;
  city: string | null;
  state: string | null;
  seoScore: number;
  reviewScore: number;
  socialScore: number;
  websiteScore: number;
  overallScore: number;
  findings: Finding[];
  recommendations: string[];
  estimatedRevenue: number | null;
  viewCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreGrade(score: number): { grade: string; color: string; bg: string } {
  if (score >= 90) return { grade: "A+", color: "text-emerald-400", bg: "bg-emerald-500" };
  if (score >= 80) return { grade: "A", color: "text-emerald-400", bg: "bg-emerald-500" };
  if (score >= 70) return { grade: "B", color: "text-blue-400", bg: "bg-blue-500" };
  if (score >= 60) return { grade: "C", color: "text-amber-400", bg: "bg-amber-500" };
  if (score >= 40) return { grade: "D", color: "text-orange-400", bg: "bg-orange-500" };
  return { grade: "F", color: "text-red-400", bg: "bg-red-500" };
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: Info,
  info: CheckCircle2,
};

const SEVERITY_COLORS = {
  critical: "text-red-400 bg-red-500/10",
  warning: "text-amber-400 bg-amber-500/10",
  info: "text-blue-400 bg-blue-500/10",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SnapshotPublicPage() {
  const { toast } = useToast();
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SnapshotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    async function fetchSnapshot() {
      try {
        const res = await fetch(`/api/snapshots/${token}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    if (token) fetchSnapshot();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" aria-hidden="true" />
        <span className="sr-only">Loading report...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4" role="alert">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-white">Report Not Found</h1>
          <p className="mt-2 text-sm text-zinc-400">
            This snapshot report may have been removed or the link is invalid.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const overall = scoreGrade(data.overallScore);
  const scores = [
    { label: "SEO", score: data.seoScore, icon: Search },
    { label: "Reviews", score: data.reviewScore, icon: Star },
    { label: "Social Media", score: data.socialScore, icon: Share2 },
    { label: "Website", score: data.websiteScore, icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-600/20 to-transparent py-12 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm mb-6">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-zinc-300">Digital Marketing Audit Report</span>
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl">{data.businessName}</h1>
          {(data.city || data.state) && (
            <p className="mt-2 text-zinc-400">
              {data.city}{data.city && data.state ? ", " : ""}{data.state}
            </p>
          )}

          {/* Overall Score */}
          <div className="mt-8 inline-flex flex-col items-center">
            <div
              className={`flex h-32 w-32 items-center justify-center rounded-full ${overall.bg}/20 border-4 ${overall.bg.replace("bg-", "border-")}/40`}
            >
              <div className="text-center">
                <p className={`text-4xl font-bold ${overall.color}`}>
                  {data.overallScore}
                </p>
                <p className={`text-sm font-semibold ${overall.color}`}>
                  Grade: {overall.grade}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-400">Overall Marketing Score</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-20">
        {/* Section Scores */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 -mt-4 mb-10">
          {scores.map((s) => {
            const g = scoreGrade(s.score);
            return (
              <div
                key={s.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center"
              >
                <s.icon className={`h-5 w-5 mx-auto mb-2 ${g.color}`} />
                <p className={`text-2xl font-bold ${g.color}`}>{s.score}</p>
                <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
                <p className={`text-xs font-semibold ${g.color} mt-0.5`}>{g.grade}</p>
              </div>
            );
          })}
        </div>

        {/* Key Findings */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Key Findings
          </h2>
          <div className="space-y-3">
            {data.findings.map((f, i) => {
              const SevIcon = SEVERITY_ICONS[f.severity];
              const sevColor = SEVERITY_COLORS[f.severity];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                >
                  <div className={`rounded-lg p-2 shrink-0 ${sevColor}`} aria-hidden="true">
                    <SevIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.area}</p>
                    <p className="text-sm text-zinc-400 mt-0.5">{f.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Potential */}
        {data.estimatedRevenue && data.estimatedRevenue > 0 && (
          <div className="mb-10 rounded-xl bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border border-blue-500/20 p-6 text-center">
            <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 mb-1">Estimated Monthly Revenue You're Missing</p>
            <p className="text-3xl font-bold text-emerald-400">
              {formatCurrency(data.estimatedRevenue)}
            </p>
            <p className="text-xs text-zinc-400 mt-2">
              Based on industry benchmarks for your market
            </p>
          </div>
        )}

        {/* Recommendations */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            What We Can Do For You
          </h2>
          <div className="space-y-3">
            {data.recommendations.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-zinc-300">{r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Ready to Dominate Your Market?
          </h2>
          <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">
            Book a free 15-minute strategy call. We will show you exactly how AI can transform your marketing
            and grow your business.
          </p>
          <button
            type="button"
            onClick={() => setShowBooking(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-sm font-bold text-gray-900 hover:bg-white/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <ExternalLink className="h-4 w-4" />
            Book a Free Strategy Call
          </button>
        </div>

        {/* Booking Modal */}
        {showBooking && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            onClick={(e) => { if (e.target === e.currentTarget) setShowBooking(false); }}
            onKeyDown={(e) => { if (e.key === "Escape") setShowBooking(false); }}
          >
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0f] p-6">
              <h3 id="booking-modal-title" className="text-lg font-bold text-white mb-4">
                Book Your Free Strategy Call
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowBooking(false);
                  toast("Thank you! Our team will reach out to you shortly.", "success");
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="booking-name" className="sr-only">Your Name</label>
                  <input
                    id="booking-name"
                    type="text"
                    placeholder="Your Name"
                    required
                    autoFocus
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="booking-phone" className="sr-only">Phone Number</label>
                  <input
                    id="booking-phone"
                    type="tel"
                    placeholder="Phone Number"
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="booking-email" className="sr-only">Email Address</label>
                  <input
                    id="booking-email"
                    type="email"
                    placeholder="Email Address"
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBooking(false)}
                    className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    Book Call
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center border-t border-white/[0.06] pt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-emerald-500">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Sovereign AI</span>
          </div>
          <p className="text-xs text-zinc-500">
            AI-Powered Marketing for Local Businesses
          </p>
        </div>
      </div>
    </div>
  );
}
