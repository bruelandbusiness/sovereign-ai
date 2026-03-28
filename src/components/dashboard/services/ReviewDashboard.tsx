"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatShort } from "@/lib/date-utils";
import {
  Star,
  Send,
  Mail,
  Plus,
  TrendingUp,
  MessageSquare,
  Shield,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Pencil,
  Users,
  Zap,
  Target,
  ArrowUpRight,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedTabs } from "@/components/ui/AnimatedTabs";
import { useToast } from "@/components/ui/toast-context";
import {
  ServiceHero,
  MetricCard,
} from "./ServiceDetailLayout";

// ── Types ──────────────────────────────────────────────────────

interface ReviewCampaign {
  id: string;
  name: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: string;
  reviewUrl: string | null;
  sentAt: string | null;
  remindedAt: string | null;
  completedAt: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

interface DemoReview {
  id: string;
  platform: "google" | "yelp" | "facebook";
  author: string;
  rating: number;
  text: string;
  date: string;
  aiResponse: string | null;
  aiResponseStatus: "draft" | "approved" | "published" | null;
}

// ── Demo Data ──────────────────────────────────────────────────

const DEMO_REVIEWS: DemoReview[] = [
  {
    id: "r1",
    platform: "google",
    author: "Sarah M.",
    rating: 5,
    text: "Incredible service! They replaced our entire HVAC system in one day. The team was professional, clean, and explained everything. Highly recommend to anyone in the area looking for reliable work.",
    date: "2026-03-26",
    aiResponse:
      "Thank you so much, Sarah! We take pride in delivering fast, clean installations. It was a pleasure working with you, and we're glad the new system is keeping you comfortable. Don't hesitate to reach out if you ever need anything!",
    aiResponseStatus: "published",
  },
  {
    id: "r2",
    platform: "google",
    author: "James T.",
    rating: 5,
    text: "Called about a leak on a Sunday and they had someone out within 2 hours. Fixed the issue quickly and the price was very fair. This is our go-to plumber from now on.",
    date: "2026-03-24",
    aiResponse:
      "James, thank you for the kind words! We know plumbing emergencies don't wait for business hours, so we're always ready. We appreciate your trust and look forward to helping you anytime.",
    aiResponseStatus: "published",
  },
  {
    id: "r3",
    platform: "yelp",
    author: "Linda K.",
    rating: 4,
    text: "Good work on the roof repair. Arrived on time and the crew was professional. Only reason for 4 stars is the cleanup could have been a bit more thorough.",
    date: "2026-03-22",
    aiResponse:
      "Hi Linda, we appreciate your feedback! We're glad the repair went well. We've noted your comment about cleanup and will make sure our crews double-check the site before leaving. Thank you for choosing us!",
    aiResponseStatus: "approved",
  },
  {
    id: "r4",
    platform: "facebook",
    author: "Mike R.",
    rating: 5,
    text: "Just had them install a tankless water heater. The difference is night and day. Endless hot water and my gas bill dropped. The installer was knowledgeable and answered all my questions.",
    date: "2026-03-20",
    aiResponse: null,
    aiResponseStatus: null,
  },
  {
    id: "r5",
    platform: "google",
    author: "Patricia D.",
    rating: 3,
    text: "The work itself was fine but scheduling was a bit of a hassle. Had to reschedule twice before they could come out. Once they arrived the job was done well.",
    date: "2026-03-18",
    aiResponse:
      "Patricia, thank you for sharing your experience. We sincerely apologize for the scheduling difficulties. We've been improving our booking system to prevent this. We're glad the work met your expectations and hope to earn 5 stars next time!",
    aiResponseStatus: "draft",
  },
  {
    id: "r6",
    platform: "yelp",
    author: "David H.",
    rating: 5,
    text: "Best contractor experience I've ever had. From the estimate to final walkthrough, everything was transparent and professional. The new bathroom looks amazing.",
    date: "2026-03-15",
    aiResponse:
      "David, this means the world to us! Transparency is one of our core values, and we're thrilled you noticed. Enjoy that new bathroom!",
    aiResponseStatus: "published",
  },
  {
    id: "r7",
    platform: "google",
    author: "Karen W.",
    rating: 2,
    text: "Showed up late and the initial quote changed after they started. The work quality was okay but the communication needs improvement.",
    date: "2026-03-12",
    aiResponse:
      "Karen, we're sorry about your experience. Punctuality and transparent pricing are extremely important to us. We'd like to make this right. Could you contact our office so we can discuss this further? Your feedback helps us improve.",
    aiResponseStatus: "draft",
  },
  {
    id: "r8",
    platform: "facebook",
    author: "Tom B.",
    rating: 5,
    text: "These guys are the real deal. Third time using them and every experience has been top notch. Fair pricing, quality work, and great people.",
    date: "2026-03-10",
    aiResponse:
      "Tom, loyal customers like you are the backbone of our business! Thank you for your continued trust. We look forward to helping you with your next project!",
    aiResponseStatus: "published",
  },
];

// ── Helpers ────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-7 w-7" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={`${sizeClass} ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    google: { label: "Google", classes: "bg-blue-500/10 text-blue-400" },
    yelp: { label: "Yelp", classes: "bg-red-500/10 text-red-400" },
    facebook: {
      label: "Facebook",
      classes: "bg-indigo-500/10 text-indigo-400",
    },
  };
  const { label, classes } = config[platform] ?? {
    label: platform,
    classes: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function formatRelativeDemo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Computed Stats ─────────────────────────────────────────────

function computeReviewStats(reviews: DemoReview[]) {
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const respondedCount = reviews.filter((r) => r.aiResponse !== null).length;
  const responseRate =
    totalReviews > 0
      ? Math.round((respondedCount / totalReviews) * 100)
      : 0;

  const positive = reviews.filter((r) => r.rating >= 4).length;
  const neutral = reviews.filter((r) => r.rating === 3).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  // Reputation score: weighted composite
  const ratingScore = (avgRating / 5) * 35;
  const volumeScore = Math.min(totalReviews / 50, 1) * 25;
  const responseScore = (responseRate / 100) * 25;
  const newestReviewDate = reviews
    .map((r) => new Date(r.date).getTime())
    .sort((a, b) => b - a)[0];
  const recencyDays = newestReviewDate
    ? Math.floor((Date.now() - newestReviewDate) / (1000 * 60 * 60 * 24))
    : 30;
  const recencyScore = Math.max(0, 1 - recencyDays / 30) * 15;
  const reputationScore = Math.round(
    ratingScore + volumeScore + responseScore + recencyScore
  );

  return {
    totalReviews,
    avgRating,
    respondedCount,
    responseRate,
    positive,
    neutral,
    negative,
    ratingDistribution,
    reputationScore,
    recencyDays,
  };
}

type ReviewStats = ReturnType<typeof computeReviewStats>;

// ── Tab: Review Dashboard Overview ─────────────────────────────

function ReviewOverview({ stats }: { stats: ReviewStats }) {
  return (
    <div className="space-y-6">
      {/* Top KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Average Rating */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col items-start">
              <span className="text-4xl font-bold tabular-nums text-amber-400">
                {stats.avgRating.toFixed(1)}
              </span>
              <div className="mt-1">
                <StarRating
                  rating={Math.round(stats.avgRating)}
                  size="md"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Average Rating
            </p>
          </CardContent>
        </Card>

        {/* Total Reviews */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">
                {stats.totalReviews}
              </span>
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                +12 this month
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Total Reviews
            </p>
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card>
          <CardContent className="p-5">
            <span className="text-4xl font-bold tabular-nums text-emerald-400">
              {stats.responseRate}%
            </span>
            <p className="mt-2 text-xs text-muted-foreground">
              AI Response Rate
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${stats.responseRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Breakdown */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">
                  Positive
                </span>
                <span className="ml-auto text-xs font-semibold tabular-nums">
                  {stats.totalReviews > 0
                    ? Math.round(
                        (stats.positive / stats.totalReviews) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  Neutral
                </span>
                <span className="ml-auto text-xs font-semibold tabular-nums">
                  {stats.totalReviews > 0
                    ? Math.round(
                        (stats.neutral / stats.totalReviews) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="text-xs text-muted-foreground">
                  Negative
                </span>
                <span className="ml-auto text-xs font-semibold tabular-nums">
                  {stats.totalReviews > 0
                    ? Math.round(
                        (stats.negative / stats.totalReviews) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Sentiment Breakdown
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-amber-400" />
            Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.ratingDistribution.map(({ star, count }) => {
              const pct =
                stats.totalReviews > 0
                  ? (count / stats.totalReviews) * 100
                  : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex w-16 items-center gap-1">
                    <span className="text-sm font-medium tabular-nums">
                      {star}
                    </span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div
                    className="h-3 flex-1 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${star} stars: ${count} reviews, ${Math.round(pct)}%`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          star >= 4
                            ? "#22d3a1"
                            : star === 3
                              ? "#facc15"
                              : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium tabular-nums">
                    {count}
                  </span>
                  <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                    {Math.round(pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Recent Reviews Feed ───────────────────────────────────

function RecentReviewsFeed({ reviews }: { reviews: DemoReview[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const TEXT_LIMIT = 150;

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isExpanded = expandedIds.has(review.id);
        const isLong = review.text.length > TEXT_LIMIT;
        const displayText =
          isLong && !isExpanded
            ? review.text.slice(0, TEXT_LIMIT) + "..."
            : review.text;

        return (
          <div
            key={review.id}
            className="rounded-xl border border-border/50 bg-muted/20 p-5 transition-all hover:border-border"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {review.author.charAt(0)}
              </div>
              <span className="font-semibold">{review.author}</span>
              <StarRating rating={review.rating} />
              <PlatformBadge platform={review.platform} />
              <span className="ml-auto text-xs text-muted-foreground">
                {formatRelativeDemo(review.date)}
              </span>
            </div>

            {/* Review Text */}
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">
              {displayText}
            </p>
            {isLong && (
              <button
                onClick={() => toggleExpand(review.id)}
                className="mt-1 text-xs font-medium text-primary hover:underline"
              >
                {isExpanded ? (
                  <span className="flex items-center gap-1">
                    <ChevronUp className="h-3 w-3" /> Show less
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ChevronDown className="h-3 w-3" /> Read more
                  </span>
                )}
              </button>
            )}

            {/* AI Response */}
            {review.aiResponse && (
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Responded
                  </div>
                  {review.aiResponseStatus === "published" && (
                    <Badge variant="default" className="text-[10px]">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Published
                    </Badge>
                  )}
                  {review.aiResponseStatus === "approved" && (
                    <Badge variant="responded" className="text-[10px]">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Approved
                    </Badge>
                  )}
                  {review.aiResponseStatus === "draft" && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Clock className="mr-1 h-3 w-3" />
                      Draft
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {review.aiResponse}
                </p>
                {(review.aiResponseStatus === "draft" ||
                  review.aiResponseStatus === "approved") && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit Response
                    </Button>
                    <Button size="sm">
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Approve &amp; Post
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Pending AI response */}
            {!review.aiResponse && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-amber-400">
                  AI response generating...
                </span>
                <Button size="sm" variant="outline" className="ml-auto">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Generate Now
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Review Request Tracker ────────────────────────────────

function ReviewRequestTracker({
  campaigns,
  isSubmitting,
  sendingId,
  formError,
  customerName,
  customerEmail,
  reviewUrl,
  onCustomerNameChange,
  onCustomerEmailChange,
  onReviewUrlChange,
  onCreateCampaign,
  onSendRequest,
}: {
  campaigns: ReviewCampaign[];
  isSubmitting: boolean;
  sendingId: string | null;
  formError: string | null;
  customerName: string;
  customerEmail: string;
  reviewUrl: string;
  onCustomerNameChange: (v: string) => void;
  onCustomerEmailChange: (v: string) => void;
  onReviewUrlChange: (v: string) => void;
  onCreateCampaign: (e: React.FormEvent) => void;
  onSendRequest: (id: string) => void;
}) {
  const totalSent = campaigns.filter((c) => c.status !== "pending").length;
  const totalCompleted = campaigns.filter(
    (c) => c.status === "completed"
  ).length;
  const completionRate =
    totalSent > 0 ? Math.round((totalCompleted / totalSent) * 100) : 0;

  const STATUS_CONFIG: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" | "contacted" | "responded" | "destructive" }
  > = {
    pending: { label: "Pending", variant: "outline" },
    sent: { label: "Sent", variant: "contacted" },
    reminded: { label: "Reminded", variant: "contacted" },
    completed: { label: "Completed", variant: "responded" },
    opted_out: { label: "Opted Out", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Requests Sent This Month"
          value={totalSent}
          icon={Send}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <MetricCard
          label="Reviews Received"
          value={totalCompleted}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <MetricCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={Target}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          trend={
            completionRate > 30
              ? `${completionRate - 15}% industry avg`
              : undefined
          }
          trendUp={completionRate > 30}
        />
      </div>

      {/* New Campaign Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Send Review Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreateCampaign} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="rr-name"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Customer Name *
                </label>
                <Input
                  id="rr-name"
                  placeholder="Jane Smith"
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="rr-email"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Customer Email *
                </label>
                <Input
                  id="rr-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={customerEmail}
                  onChange={(e) => onCustomerEmailChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="rr-url"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Review URL
                </label>
                <Input
                  id="rr-url"
                  type="url"
                  placeholder="https://g.page/r/..."
                  value={reviewUrl}
                  onChange={(e) => onReviewUrlChange(e.target.value)}
                />
              </div>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <Button type="submit" disabled={isSubmitting}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? "Creating..." : "Send Review Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Campaigns ({campaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No campaigns yet. Send your first review request above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                aria-label="Review campaigns"
              >
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Sent
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Rating
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const statusConfig = STATUS_CONFIG[campaign.status] ?? {
                      label: campaign.status,
                      variant: "outline" as const,
                    };
                    return (
                      <tr
                        key={campaign.id}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <div>
                            <p className="font-medium">
                              {campaign.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {campaign.customerEmail}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {campaign.sentAt
                            ? formatShort(campaign.sentAt)
                            : "--"}
                        </td>
                        <td className="py-3 pr-4">
                          {campaign.rating !== null ? (
                            <span className="flex items-center gap-1 font-medium text-amber-400">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {campaign.rating}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              --
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {campaign.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sendingId === campaign.id}
                              onClick={() => onSendRequest(campaign.id)}
                            >
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                              {sendingId === campaign.id
                                ? "Sending..."
                                : "Send"}
                            </Button>
                          )}
                          {campaign.status === "sent" && (
                            <Button size="sm" variant="ghost">
                              <Mail className="mr-1.5 h-3.5 w-3.5" />
                              Remind
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Reputation Score Card ──────────────────────────────────

function ReputationScoreSection({ stats }: { stats: ReviewStats }) {
  const score = stats.reputationScore;
  const scoreColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 60
        ? "text-yellow-400"
        : "text-red-400";
  const scoreLabel =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work";
  const scoreBg =
    score >= 80
      ? "bg-emerald-500/5"
      : score >= 60
        ? "bg-yellow-500/5"
        : "bg-red-500/5";

  const factors = [
    {
      label: "Average Rating",
      value: `${stats.avgRating.toFixed(1)} / 5.0`,
      factorScore: Math.round((stats.avgRating / 5) * 100),
      weight: "35%",
      icon: Star,
      color: "text-amber-400",
    },
    {
      label: "Review Volume",
      value: `${stats.totalReviews} reviews`,
      factorScore: Math.min(
        Math.round((stats.totalReviews / 50) * 100),
        100
      ),
      weight: "25%",
      icon: MessageSquare,
      color: "text-blue-400",
    },
    {
      label: "Response Rate",
      value: `${stats.responseRate}%`,
      factorScore: stats.responseRate,
      weight: "25%",
      icon: Zap,
      color: "text-emerald-400",
    },
    {
      label: "Review Recency",
      value:
        stats.recencyDays <= 1
          ? "Today"
          : `${stats.recencyDays} days ago`,
      factorScore: Math.max(
        0,
        Math.round((1 - stats.recencyDays / 30) * 100)
      ),
      weight: "15%",
      icon: Clock,
      color: "text-purple-400",
    },
  ];

  const tips = [
    {
      priority: "high" as const,
      text: "Respond to the 1 unresponded review to reach 100% response rate",
    },
    {
      priority: "medium" as const,
      text: "Send review requests to 5 recent customers to boost volume",
    },
    {
      priority: "low" as const,
      text: "Address the scheduling concern in Patricia's 3-star review publicly",
    },
  ];

  const priorityConfig = {
    high: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      label: "High Impact",
    },
    medium: {
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      label: "Medium Impact",
    },
    low: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      label: "Quick Win",
    },
  };

  return (
    <div className="space-y-6">
      {/* Score Hero */}
      <Card className={scoreBg}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            {/* SVG Score Ring */}
            <div className="relative flex shrink-0 items-center justify-center">
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                role="meter"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Reputation score: ${score} out of 100`}
              >
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  className="text-muted/30"
                  strokeWidth="8"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="currentColor"
                  className={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 377} 377`}
                  transform="rotate(-90 70 70)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor}`}>
                  {score}
                </span>
                <span className="text-xs text-muted-foreground">
                  / 100
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Shield className={`h-5 w-5 ${scoreColor}`} />
                <h3 className="text-xl font-bold">Reputation Score</h3>
              </div>
              <p className={`mt-1 text-sm font-semibold ${scoreColor}`}>
                {scoreLabel}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Your online reputation is strong. Customers searching for
                contractors in your area are likely to choose you based on
                your reviews and responsiveness. Keep responding to reviews
                and requesting feedback from happy customers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Factor Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Score Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {factors.map((factor) => {
              const Icon = factor.icon;
              return (
                <div key={factor.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${factor.color}`} />
                      <span className="text-sm font-medium">
                        {factor.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({factor.weight})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {factor.value}
                      </span>
                      <span className="w-10 text-right text-sm font-semibold tabular-nums">
                        {factor.factorScore}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${factor.factorScore}%`,
                        backgroundColor:
                          factor.factorScore >= 80
                            ? "#22d3a1"
                            : factor.factorScore >= 60
                              ? "#facc15"
                              : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            How to Improve Your Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tips.map((tip, i) => {
              const config = priorityConfig[tip.priority];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                >
                  <AlertCircle
                    className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`}
                  />
                  <p className="flex-1 text-sm">{tip.text}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.color}`}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function ReviewDashboard() {
  const { toast } = useToast();
  const {
    data: campaigns,
    error: campaignsError,
    isLoading,
    mutate,
  } = useSWR<ReviewCampaign[]>(
    "/api/services/reviews/campaigns",
    fetcher
  );

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [autoResponseTemplate, setAutoResponseTemplate] = useState<
    string | null
  >(null);

  const campaignList = campaigns || [];

  // Compute stats from demo review data
  const stats = computeReviewStats(DEMO_REVIEWS);

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      setFormError("Customer name and email are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/services/reviews/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          reviewUrl: reviewUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to create campaign.");
        return;
      }

      setCustomerName("");
      setCustomerEmail("");
      setReviewUrl("");
      mutate();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSendRequest(campaignId: string) {
    setSendingId(campaignId);
    try {
      const res = await fetch("/api/services/reviews/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(
          data.error || "Failed to send review request.",
          "error"
        );
        return;
      }

      mutate();
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setSendingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">
          Loading review dashboard...
        </p>
      </div>
    );
  }

  if (campaignsError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load review data. Make sure the review service is
          provisioned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <ServiceHero
        serviceName="AI Review Management"
        tagline="Your AI is monitoring, responding to, and growing your online reputation"
        icon={Star}
        iconBg="bg-amber-500/10"
        iconColor="text-amber-400"
        isActive
        sinceDate={
          campaignList.length > 0
            ? campaignList[campaignList.length - 1].createdAt
            : null
        }
      />

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Avg Rating"
          value={stats.avgRating.toFixed(1)}
          icon={Star}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          trend={`${stats.ratingDistribution[0].count} five-star reviews`}
          trendUp
        />
        <MetricCard
          label="Total Reviews"
          value={stats.totalReviews}
          icon={MessageSquare}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          trend="+12 this month"
          trendUp
        />
        <MetricCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          icon={Zap}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          trend="Industry avg: 15%"
          trendUp
        />
        <MetricCard
          label="Reputation Score"
          value={`${stats.reputationScore}/100`}
          icon={Shield}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          trend={
            stats.reputationScore >= 80
              ? "Excellent"
              : stats.reputationScore >= 60
                ? "Good"
                : "Needs work"
          }
          trendUp={stats.reputationScore >= 60}
        />
        <MetricCard
          label="Campaigns Sent"
          value={campaignList.filter((c) => c.status !== "pending").length}
          icon={Send}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
          trend={`${campaignList.filter((c) => c.status === "completed").length} completed`}
          trendUp
        />
      </div>

      {/* Tabbed Sections */}
      <AnimatedTabs
        items={[
          {
            value: "overview",
            label: "Overview",
            icon: <TrendingUp className="h-4 w-4" />,
            content: <ReviewOverview stats={stats} />,
          },
          {
            value: "reviews",
            label: "Recent Reviews",
            icon: <MessageSquare className="h-4 w-4" />,
            content: <RecentReviewsFeed reviews={DEMO_REVIEWS} />,
          },
          {
            value: "requests",
            label: "Request Tracker",
            icon: <Send className="h-4 w-4" />,
            content: (
              <ReviewRequestTracker
                campaigns={campaignList}
                isSubmitting={isSubmitting}
                sendingId={sendingId}
                formError={formError}
                customerName={customerName}
                customerEmail={customerEmail}
                reviewUrl={reviewUrl}
                onCustomerNameChange={setCustomerName}
                onCustomerEmailChange={setCustomerEmail}
                onReviewUrlChange={setReviewUrl}
                onCreateCampaign={handleCreateCampaign}
                onSendRequest={handleSendRequest}
              />
            ),
          },
          {
            value: "reputation",
            label: "Reputation Score",
            icon: <Shield className="h-4 w-4" />,
            content: <ReputationScoreSection stats={stats} />,
          },
        ]}
        contentClassName="border-none bg-transparent"
      />

      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Review Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-respond">
              Auto-Respond to Reviews
            </Label>
            <Switch id="auto-respond" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-remind">
              Auto-Send Reminders (48h)
            </Label>
            <Switch id="auto-remind" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="negative-alerts">
              Negative Review Alerts
            </Label>
            <Switch id="negative-alerts" defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="response-template">
              AI Response Tone
            </Label>
            <Textarea
              id="response-template"
              value={
                autoResponseTemplate ??
                "Friendly and professional. Mention our commitment to quality. Thank customers by name."
              }
              onChange={(e) =>
                setAutoResponseTemplate(e.target.value)
              }
              rows={3}
              placeholder="Describe the tone for AI-generated review responses..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
