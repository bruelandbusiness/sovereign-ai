"use client";

import { useState, useCallback } from "react";
import {
  Users,
  UserCheck,
  DollarSign,
  Wallet,
  Copy,
  Check,
  Mail,
  MessageSquare,
  Send,
  Gift,
  Loader2,
  Clock,
  Trophy,
  Star,
  Share2,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ─── Types ──────────────────────────────────────────────────

type ReferralStatus =
  | "pending"
  | "signed_up"
  | "active"
  | "churned"
  | "converted";

interface ReferralRecord {
  id: string;
  referredBusiness: string;
  referredName: string;
  dateReferred: string;
  status: ReferralStatus;
  rewardAmountCents: number;
  plan: string;
}

interface ReferralStats {
  totalReferrals: number;
  successfulConversions: number;
  pendingReferrals: number;
  totalEarnedCents: number;
  pendingRewardsCents: number;
  creditsUsedCents: number;
  creditsAvailableCents: number;
}

interface RewardMilestone {
  label: string;
  referralsNeeded: number;
  bonusCents: number;
  reached: boolean;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  referrals: number;
  earnedCents: number;
  isCurrentUser: boolean;
}

// ─── Demo Data ──────────────────────────────────────────────

const REFERRAL_LINK = "https://sovereignai.com/ref/CONTRACTOR-7X92K";
const REFERRAL_CODE = "CONTRACTOR-7X92K";

const DEMO_STATS: ReferralStats = {
  totalReferrals: 12,
  successfulConversions: 7,
  pendingReferrals: 3,
  totalEarnedCents: 350_000,
  pendingRewardsCents: 150_000,
  creditsUsedCents: 200_000,
  creditsAvailableCents: 150_000,
};

const DEMO_REFERRALS: ReferralRecord[] = [
  {
    id: "ref-1",
    referredBusiness: "Martinez Plumbing Co.",
    referredName: "Carlos Martinez",
    dateReferred: "2026-03-15",
    status: "active",
    rewardAmountCents: 50_000,
    plan: "Growth",
  },
  {
    id: "ref-2",
    referredBusiness: "Apex Electric LLC",
    referredName: "Danielle Reeves",
    dateReferred: "2026-03-10",
    status: "active",
    rewardAmountCents: 50_000,
    plan: "Pro",
  },
  {
    id: "ref-3",
    referredBusiness: "Summit Roofing",
    referredName: "Jake Thornton",
    dateReferred: "2026-03-05",
    status: "signed_up",
    rewardAmountCents: 0,
    plan: "Trial",
  },
  {
    id: "ref-4",
    referredBusiness: "Greenfield Landscaping",
    referredName: "Maria Santos",
    dateReferred: "2026-02-28",
    status: "active",
    rewardAmountCents: 50_000,
    plan: "Growth",
  },
  {
    id: "ref-5",
    referredBusiness: "Premier Painting",
    referredName: "Tom Whitfield",
    dateReferred: "2026-02-20",
    status: "converted",
    rewardAmountCents: 50_000,
    plan: "Pro",
  },
  {
    id: "ref-6",
    referredBusiness: "Atlas Construction",
    referredName: "Derek Huang",
    dateReferred: "2026-02-14",
    status: "pending",
    rewardAmountCents: 0,
    plan: "—",
  },
  {
    id: "ref-7",
    referredBusiness: "Blue Sky HVAC",
    referredName: "Rachel Kim",
    dateReferred: "2026-02-01",
    status: "active",
    rewardAmountCents: 50_000,
    plan: "Growth",
  },
  {
    id: "ref-8",
    referredBusiness: "Ironclad Welding",
    referredName: "Steve Novak",
    dateReferred: "2026-01-22",
    status: "churned",
    rewardAmountCents: 50_000,
    plan: "—",
  },
  {
    id: "ref-9",
    referredBusiness: "Reliable Plumbing",
    referredName: "Amanda Foster",
    dateReferred: "2026-01-15",
    status: "pending",
    rewardAmountCents: 0,
    plan: "—",
  },
  {
    id: "ref-10",
    referredBusiness: "Cascade Builders",
    referredName: "Will Patterson",
    dateReferred: "2026-01-08",
    status: "converted",
    rewardAmountCents: 50_000,
    plan: "Enterprise",
  },
  {
    id: "ref-11",
    referredBusiness: "Precision Tile Works",
    referredName: "Lisa Chang",
    dateReferred: "2025-12-20",
    status: "active",
    rewardAmountCents: 50_000,
    plan: "Growth",
  },
  {
    id: "ref-12",
    referredBusiness: "Liberty Fencing",
    referredName: "Nathan Brooks",
    dateReferred: "2025-12-10",
    status: "pending",
    rewardAmountCents: 0,
    plan: "—",
  },
];

const DEMO_MILESTONES: RewardMilestone[] = [
  {
    label: "First Referral",
    referralsNeeded: 1,
    bonusCents: 0,
    reached: true,
  },
  {
    label: "Bronze Referrer",
    referralsNeeded: 5,
    bonusCents: 25_000,
    reached: true,
  },
  {
    label: "Silver Referrer",
    referralsNeeded: 10,
    bonusCents: 75_000,
    reached: true,
  },
  {
    label: "Gold Referrer",
    referralsNeeded: 25,
    bonusCents: 250_000,
    reached: false,
  },
  {
    label: "Platinum Partner",
    referralsNeeded: 50,
    bonusCents: 750_000,
    reached: false,
  },
];

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "Contractor_A***",
    referrals: 47,
    earnedCents: 2_350_000,
    isCurrentUser: false,
  },
  {
    rank: 2,
    name: "Contractor_B***",
    referrals: 38,
    earnedCents: 1_900_000,
    isCurrentUser: false,
  },
  {
    rank: 3,
    name: "Contractor_C***",
    referrals: 31,
    earnedCents: 1_550_000,
    isCurrentUser: false,
  },
  {
    rank: 4,
    name: "Contractor_D***",
    referrals: 24,
    earnedCents: 1_200_000,
    isCurrentUser: false,
  },
  {
    rank: 5,
    name: "Contractor_E***",
    referrals: 19,
    earnedCents: 950_000,
    isCurrentUser: false,
  },
  {
    rank: 8,
    name: "You",
    referrals: 12,
    earnedCents: 350_000,
    isCurrentUser: true,
  },
];

// ─── Helpers ────────────────────────────────────────────────

function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ──────────────────────────────────────────────

export function ReferralHub() {
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const stats = DEMO_STATS;
  const referrals = DEMO_REFERRALS;
  const milestones = DEMO_MILESTONES;
  const leaderboard = DEMO_LEADERBOARD;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = REFERRAL_LINK;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleEmailShare = useCallback(() => {
    const subject = encodeURIComponent(
      "Check out Sovereign AI — AI-Powered Marketing"
    );
    const body = encodeURIComponent(
      `Hey,\n\nI've been using Sovereign AI for my business and it's been incredible. Thought you might want to check it out:\n\n${REFERRAL_LINK}\n\nThey handle lead generation, review management, and content creation — all powered by AI.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }, []);

  const handleSmsShare = useCallback(() => {
    const body = encodeURIComponent(
      `Hey! I've been using Sovereign AI for my business and it's awesome. Check it out: ${REFERRAL_LINK}`
    );
    window.open(`sms:?body=${body}`, "_blank");
  }, []);

  const handleSocialShare = useCallback(() => {
    const text = encodeURIComponent(
      `I've been using @SovereignAI for my business and seeing incredible results. If you're a contractor looking to grow, check them out: ${REFERRAL_LINK}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      "_blank",
      "width=550,height=420"
    );
  }, []);

  const handleSendInvites = useCallback(async () => {
    if (!emailInput.trim()) return;

    const emails = emailInput
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/dashboard/referrals/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails,
          message: messageInput || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send invitations");
      }

      const result = await res.json();
      setSendResult(
        `Sent ${result.sent} of ${result.total} invitation${result.total !== 1 ? "s" : ""} successfully!`
      );
      setEmailInput("");
      setMessageInput("");
    } catch (err) {
      setSendResult(
        err instanceof Error ? err.message : "Failed to send invitations"
      );
    } finally {
      setIsSending(false);
    }
  }, [emailInput, messageInput]);

  // ─── Next milestone ───────────────────────────────────────

  const nextMilestone = milestones.find((m) => !m.reached);
  const prevMilestone = [...milestones]
    .reverse()
    .find((m) => m.reached);
  const milestoneProgress = nextMilestone
    ? Math.min(
        100,
        ((stats.totalReferrals - (prevMilestone?.referralsNeeded ?? 0)) /
          (nextMilestone.referralsNeeded -
            (prevMilestone?.referralsNeeded ?? 0))) *
          100
      )
    : 100;

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Motivational banner ─────────────────────────────── */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-emerald-500/5 to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              Earn $500 for Every Contractor You Refer
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your unique link with fellow contractors. When they sign up
              and become paying clients, you earn a $500 credit on your account.
              No limits — the more you refer, the more you earn.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats grid ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
          label="Total Referrals"
          value={String(stats.totalReferrals)}
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          label="Conversions"
          value={String(stats.successfulConversions)}
          subtext={`${Math.round((stats.successfulConversions / stats.totalReferrals) * 100)}% rate`}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5 text-amber-400" />}
          iconBg="bg-amber-500/10"
          label="Rewards Earned"
          value={formatDollars(stats.totalEarnedCents)}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-purple-400" />}
          iconBg="bg-purple-500/10"
          label="Pending"
          value={String(stats.pendingReferrals)}
          subtext={formatDollars(stats.pendingRewardsCents) + " potential"}
        />
      </div>

      {/* ── Referral link + share ───────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your Referral Link
          </h3>

          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="truncate text-sm font-mono font-medium">
                {REFERRAL_LINK}
              </p>
            </div>
            <Button
              variant={copied ? "primary" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Referral code: <span className="font-mono font-medium text-foreground">{REFERRAL_CODE}</span>
          </p>

          {/* Share buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmailShare}>
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleSmsShare}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              SMS
            </Button>
            <Button variant="outline" size="sm" onClick={handleSocialShare}>
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Twitter / X
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Rewards tracker ─────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Rewards Tracker
            </h3>
            <div className="flex items-center gap-1.5 text-sm">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-emerald-400">
                {formatDollars(stats.creditsAvailableCents)}
              </span>
              <span className="text-muted-foreground">available</span>
            </div>
          </div>

          {/* Reward summary cards */}
          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <div className="rounded-lg border border-border/50 bg-emerald-500/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Earned
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-400">
                {formatDollars(stats.totalEarnedCents)}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-amber-500/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pending
              </p>
              <p className="mt-1 text-xl font-bold text-amber-400">
                {formatDollars(stats.pendingRewardsCents)}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-blue-500/5 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Redeemed
              </p>
              <p className="mt-1 text-xl font-bold text-blue-400">
                {formatDollars(stats.creditsUsedCents)}
              </p>
            </div>
          </div>

          {/* Milestone progress */}
          {nextMilestone && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">
                    Next: {nextMilestone.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {stats.totalReferrals} / {nextMilestone.referralsNeeded}{" "}
                  referrals
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {nextMilestone.referralsNeeded - stats.totalReferrals} more
                referrals to unlock a{" "}
                <span className="font-semibold text-primary">
                  {formatDollars(nextMilestone.bonusCents)} bonus
                </span>
              </p>
            </div>
          )}

          {/* Milestone badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {milestones.map((m) => (
              <div
                key={m.label}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${
                  m.reached
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/50 bg-muted/30 text-muted-foreground"
                }`}
              >
                {m.reached ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Star className="h-3 w-3" />
                )}
                {m.label}
                {m.bonusCents > 0 && (
                  <span className="opacity-70">
                    +{formatDollars(m.bonusCents)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Invite by email ─────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Invite by Email
          </h3>
          <div className="space-y-3">
            <div>
              <Input
                placeholder="email1@example.com, email2@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="h-10"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Separate multiple emails with commas (max 20)
              </p>
            </div>
            <Textarea
              placeholder="Add a personal message (optional)"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSendInvites}
                disabled={!emailInput.trim() || isSending}
                size="sm"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" />
                    Send Invitations
                  </>
                )}
              </Button>
              {sendResult && (
                <p className="text-sm text-muted-foreground">{sendResult}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Referral list table ─────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Referred Businesses
            </h3>
            <span className="text-xs text-muted-foreground">
              {referrals.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Business
                  </th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Date Referred
                  </th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">
                    Reward
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr
                    key={ref.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium">{ref.referredBusiness}</p>
                      <p className="text-xs text-muted-foreground">
                        {ref.referredName}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatDate(ref.dateReferred)}
                    </td>
                    <td className="py-3 pr-4">
                      <ReferralStatusBadge status={ref.status} />
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {ref.plan}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {ref.rewardAmountCents > 0 ? (
                        <span className="text-emerald-400">
                          {formatDollars(ref.rewardAmountCents)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Leaderboard ─────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4.5 w-4.5 text-amber-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Top Referrers This Quarter
            </h3>
          </div>

          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 rounded-lg px-4 py-3 transition-colors ${
                  entry.isCurrentUser
                    ? "border border-primary/30 bg-primary/5"
                    : "border border-transparent hover:bg-muted/30"
                }`}
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {entry.rank <= 3 ? (
                    <RankMedal rank={entry.rank} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      entry.isCurrentUser ? "text-primary" : ""
                    }`}
                  >
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs text-primary/70">
                        (you)
                      </span>
                    )}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {entry.referrals}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Referrals
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">
                      {formatDollars(entry.earnedCents)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Earned
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Leaderboard resets quarterly. Top 3 earn bonus rewards.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  switch (status) {
    case "active":
      return <Badge variant="qualified">Active</Badge>;
    case "converted":
      return <Badge variant="converted">Converted</Badge>;
    case "signed_up":
      return <Badge variant="contacted">Signed Up</Badge>;
    case "churned":
      return <Badge variant="destructive">Churned</Badge>;
    case "pending":
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}

function RankMedal({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "from-amber-300 to-amber-500",
    2: "from-slate-300 to-slate-400",
    3: "from-orange-400 to-orange-600",
  };

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${colors[rank] ?? ""} text-sm font-bold text-white shadow-sm`}
    >
      {rank}
    </div>
  );
}
