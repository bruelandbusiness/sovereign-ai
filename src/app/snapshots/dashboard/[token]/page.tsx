"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart3,
  Clock,
  DollarSign,
  Loader2,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SnapshotKPIs {
  leadsThisMonth: number;
  monthlyRevenue: number;
  avgReviewScore: number;
  reviewCount: number;
  activeServices: number;
  conversionRate: number;
}

interface DashboardSnapshotData {
  businessName: string;
  city: string | null;
  state: string | null;
  vertical: string | null;
  snapshotDate: string;
  expiresAt: string;
  kpis: SnapshotKPIs;
  activeServiceIds: string[];
  viewCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardSnapshotPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<DashboardSnapshotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSnapshot() {
      try {
        const res = await fetch(`/api/dashboard/snapshots/${token}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        } else if (res.status === 410) {
          setErrorMessage(
            "This snapshot has expired and is no longer available.",
          );
        } else {
          setErrorMessage(
            "This snapshot could not be found. The link may be invalid or revoked.",
          );
        }
      } catch {
        setErrorMessage("Something went wrong loading this snapshot.");
      } finally {
        setIsLoading(false);
      }
    }
    if (token) fetchSnapshot();
  }, [token]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#0a0a0f]"
        role="status"
        aria-live="polite"
      >
        <Loader2
          className="h-8 w-8 animate-spin text-blue-400"
          aria-hidden="true"
        />
        <span className="sr-only">Loading snapshot...</span>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4"
        role="alert"
      >
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <Clock className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Snapshot Unavailable</h1>
          <p className="mt-2 text-sm text-gray-400">
            {errorMessage ||
              "This snapshot could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const { kpis } = data;

  const kpiCards = [
    {
      label: "Leads This Month",
      value: kpis.leadsThisMonth.toString(),
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(kpis.monthlyRevenue),
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Avg Review Score",
      value: kpis.avgReviewScore > 0 ? kpis.avgReviewScore.toFixed(1) : "--",
      subtext: `${kpis.reviewCount} reviews`,
      icon: Star,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Conversion Rate",
      value: `${kpis.conversionRate}%`,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Active Services",
      value: kpis.activeServices.toString(),
      subtext: "of 16 available",
      icon: BarChart3,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600/15 to-transparent pb-8 pt-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <span className="text-gray-300">Dashboard Snapshot</span>
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl">
            {data.businessName}
          </h1>
          {(data.city || data.state) && (
            <p className="mt-2 text-gray-400">
              {data.city}
              {data.city && data.state ? ", " : ""}
              {data.state}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Snapshot taken on {formatDate(data.snapshotDate)}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}
                >
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>
                    {kpi.value}
                  </p>
                  {kpi.subtext && (
                    <p className="text-xs text-gray-500">{kpi.subtext}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Services List */}
        {data.activeServiceIds.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Active Services
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.activeServiceIds.map((serviceId) => (
                <span
                  key={serviceId}
                  className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
                >
                  {serviceId
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expiry Notice */}
        <div className="mt-10 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
            <Clock className="h-4 w-4" />
            <span>
              This snapshot expires on {formatDate(data.expiresAt)}
            </span>
          </div>
        </div>

        {/* Powered By Footer */}
        <div className="mt-12 border-t border-white/[0.06] pt-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-emerald-500">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">
              Powered by Sovereign AI
            </span>
          </div>
          <p className="text-xs text-gray-500">
            AI-Powered Marketing for Local Businesses
          </p>
        </div>
      </div>
    </div>
  );
}
