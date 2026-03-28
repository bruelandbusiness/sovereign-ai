"use client";

import { useState } from "react";
import useSWR from "swr";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import {
  DollarSign,
  Users,
  TrendingUp,
  Copy,
  Check,
  Clock,
  Link as LinkIcon,
  Award,
  Share2,
  FileText,
  Image as ImageIcon,
  Mail,
} from "lucide-react";
import { formatCents } from "@/lib/formatters";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TIER_THRESHOLDS = [
  { name: "Silver", min: 0, max: 4, rate: 25, color: "text-gray-300" },
  { name: "Gold", min: 5, max: 14, rate: 30, color: "text-yellow-400" },
  { name: "Platinum", min: 15, max: Infinity, rate: 35, color: "text-purple-400" },
] as const;

function getTierProgress(activeReferrals: number, currentTier: string) {
  if (currentTier === "platinum") {
    return { nextTier: null, remaining: 0, progress: 100 };
  }
  const nextTier = currentTier === "silver"
    ? TIER_THRESHOLDS[1]
    : TIER_THRESHOLDS[2];
  const currentThreshold = currentTier === "silver"
    ? TIER_THRESHOLDS[0]
    : TIER_THRESHOLDS[1];
  const needed = nextTier.min - activeReferrals;
  const range = nextTier.min - currentThreshold.min;
  const progress = Math.min(
    100,
    ((activeReferrals - currentThreshold.min) / range) * 100,
  );
  return { nextTier, remaining: Math.max(0, needed), progress };
}

export function AffiliateDashboard() {
  const { data, error, isLoading } = useSWR("/api/affiliates", fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedPrimary, setCopiedPrimary] = useState(false);

  function copyLink(code: string) {
    const url = `${window.location.origin}/onboarding?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function copyPrimaryLink(code: string) {
    const url = `${window.location.origin}/onboarding?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedPrimary(true);
    setTimeout(() => setCopiedPrimary(false), 2000);
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0f] pt-32">
          <Container>
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 rounded bg-white/10" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-white/5" />
                ))}
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  if (error || data?.error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0f] pt-32">
          <Container>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <h2 className="text-lg font-semibold text-white">
                {data?.error === "Not an affiliate partner"
                  ? "Not an Affiliate Partner"
                  : "Error Loading Dashboard"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {data?.error === "Not an affiliate partner"
                  ? "You don't have an affiliate account yet."
                  : "Please try refreshing the page."}
              </p>
              <a
                href="/affiliates/signup"
                className="mt-4 inline-block rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-6 py-2 text-sm font-medium text-white"
              >
                Apply to Become an Affiliate
              </a>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const { affiliate, stats, referrals, payouts } = data;
  const tierProgress = getTierProgress(stats.activeReferrals, affiliate.tier);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0f] pt-32 pb-20">
        <Container>
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Affiliate Dashboard
              </h1>
              <p className="mt-1 text-muted-foreground">
                Welcome back, {affiliate.name}.{" "}
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  {affiliate.commissionRate}% recurring commission
                </span>
              </p>
            </div>
            <span
              className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
                affiliate.tier === "platinum"
                  ? "bg-purple-500/10 text-purple-400"
                  : affiliate.tier === "gold"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-blue-500/10 text-blue-400"
              }`}
            >
              {affiliate.tier.charAt(0).toUpperCase() +
                affiliate.tier.slice(1)}{" "}
              Partner
            </span>
          </div>

          {/* Primary Referral Link */}
          <div className="mb-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">
                Your Referral Link
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="flex-1 rounded-lg bg-black/30 px-4 py-3 text-sm text-emerald-400 break-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/onboarding?ref=${affiliate.referralCode}`
                  : `/onboarding?ref=${affiliate.referralCode}`}
              </code>
              <button
                onClick={() => copyPrimaryLink(affiliate.referralCode)}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
              >
                {copiedPrimary ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Share this link anywhere. 90-day tracking cookie ensures you get
              credit for every signup.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Active Referrals"
              value={stats.activeReferrals.toString()}
              subtitle={`${stats.totalReferrals} total`}
            />
            <StatCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Total Earned"
              value={formatCents(stats.totalEarned)}
              subtitle={`${formatCents(stats.totalPaid)} paid out`}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Monthly Recurring"
              value={formatCents(stats.monthlyRecurring)}
              subtitle={`${affiliate.commissionRate}% of client MRR`}
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Pending Payout"
              value={formatCents(stats.pendingPayout)}
              subtitle="Next payout: 1st of month"
            />
          </div>

          {/* Tier Progress */}
          {tierProgress.nextTier && (
            <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-sm font-semibold text-white">
                    Tier Progress
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {tierProgress.remaining} more referral
                  {tierProgress.remaining !== 1 ? "s" : ""} to{" "}
                  <span className={tierProgress.nextTier.color}>
                    {tierProgress.nextTier.name} ({tierProgress.nextTier.rate}%)
                  </span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] transition-all duration-500"
                  style={{ width: `${tierProgress.progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>
                  {affiliate.tier.charAt(0).toUpperCase() +
                    affiliate.tier.slice(1)}{" "}
                  ({affiliate.commissionRate}%)
                </span>
                <span className={tierProgress.nextTier.color}>
                  {tierProgress.nextTier.name} ({tierProgress.nextTier.rate}%)
                </span>
              </div>
            </div>
          )}

          {/* Quick Share & Marketing Materials */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Quick Share */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">
                  Quick Share
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I use Sovereign AI for my home service marketing and it's been incredible. Check it out:")}&url=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/onboarding?ref=${affiliate.referralCode}` : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                >
                  Share on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? `${window.location.origin}/onboarding?ref=${affiliate.referralCode}` : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                >
                  Share on LinkedIn
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent("Check out Sovereign AI")}&body=${encodeURIComponent(`I've been using Sovereign AI for home service marketing and wanted to share it with you: ${typeof window !== "undefined" ? `${window.location.origin}/onboarding?ref=${affiliate.referralCode}` : ""}`)}`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
                <button
                  onClick={() => copyPrimaryLink(affiliate.referralCode)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </button>
              </div>
            </div>

            {/* Marketing Materials */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">
                  Marketing Materials
                </h2>
              </div>
              <div className="space-y-3">
                <MaterialLink
                  icon={<ImageIcon className="h-4 w-4" />}
                  label="Banner Ads (All Sizes)"
                  description="Web banners for your site or blog"
                />
                <MaterialLink
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Templates"
                  description="Pre-written referral email copy"
                />
                <MaterialLink
                  icon={<FileText className="h-4 w-4" />}
                  label="Case Study One-Pagers"
                  description="Share real client results"
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Contact{" "}
                <a
                  href="mailto:affiliates@trysovereignai.com"
                  className="text-emerald-400 hover:underline"
                >
                  affiliates@trysovereignai.com
                </a>{" "}
                for custom co-branded materials.
              </p>
            </div>
          </div>

          {/* Referral Links from Activity */}
          {referrals.filter(
            (r: { status: string }) =>
              r.status === "clicked" || r.status === "signed_up",
          ).length > 0 && (
            <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Recent Link Activity
              </h2>
              <div className="space-y-3">
                {referrals
                  .filter(
                    (r: { status: string }) =>
                      r.status === "clicked" || r.status === "signed_up",
                  )
                  .slice(0, 5)
                  .map((r: { id: string; code: string; status: string }) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <code className="text-sm text-emerald-400">
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/onboarding?ref=${r.code}`
                            : `/onboarding?ref=${r.code}`}
                        </code>
                        <StatusBadge status={r.status} />
                      </div>
                      <button
                        onClick={() => copyLink(r.code)}
                        className="ml-3 shrink-0 rounded-md bg-white/10 p-2 text-muted-foreground transition hover:bg-white/20 hover:text-white"
                      >
                        {copiedCode === r.code ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Referrals Table */}
          <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Referral Activity
            </h2>
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No referrals yet. Share your link to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Code</th>
                      <th className="pb-3 font-medium">Business</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">MRR</th>
                      <th className="pb-3 font-medium">Commission</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/80">
                    {referrals.map(
                      (r: {
                        id: string;
                        code: string;
                        businessName: string | null;
                        status: string;
                        monthlyAmount: number;
                        commission: number;
                        createdAt: string;
                      }) => (
                        <tr key={r.id} className="border-b border-white/5">
                          <td className="py-3 font-mono text-xs">{r.code}</td>
                          <td className="py-3">
                            {r.businessName || "\u2014"}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="py-3">
                            {r.monthlyAmount > 0
                              ? formatCents(r.monthlyAmount)
                              : "\u2014"}
                          </td>
                          <td className="py-3 text-emerald-400">
                            {r.commission > 0
                              ? formatCents(r.commission)
                              : "\u2014"}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payouts */}
          {payouts.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Payout History
              </h2>
              <div className="space-y-2">
                {payouts.map(
                  (p: {
                    id: string;
                    amount: number;
                    status: string;
                    periodStart: string;
                    periodEnd: string;
                    paidAt: string | null;
                  }) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                    >
                      <div>
                        <span className="text-sm font-medium text-white">
                          {formatCents(p.amount)}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {new Date(p.periodStart).toLocaleDateString()}{" "}
                          \u2013{" "}
                          {new Date(p.periodEnd).toLocaleDateString()}
                        </span>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    clicked: "bg-muted text-muted-foreground",
    signed_up: "bg-blue-500/10 text-blue-400",
    paying: "bg-emerald-500/10 text-emerald-400",
    churned: "bg-red-500/10 text-red-400",
    pending: "bg-yellow-500/10 text-yellow-400",
    processing: "bg-blue-500/10 text-blue-400",
    paid: "bg-emerald-500/10 text-emerald-400",
    failed: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function MaterialLink({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition hover:bg-white/10">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
