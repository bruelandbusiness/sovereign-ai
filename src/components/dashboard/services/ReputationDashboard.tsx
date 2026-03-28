"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatShort } from "@/lib/date-utils";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Star,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-context";

// ── Types ────────────────────────────────────────────────────

interface Review {
  id: string;
  platform: "google" | "yelp";
  author: string;
  rating: number;
  text: string;
  date: string;
  responseText?: string;
  respondedAt?: string;
}

interface ReviewsResponse {
  reviews: Review[];
  totalCount: number;
  platforms: {
    google: number;
    yelp: number;
  };
}

interface ReputationScoreData {
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  sentimentScore: number;
  breakdown: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

interface ScoreResponse {
  score: ReputationScoreData;
  campaigns: {
    totalCampaigns: number;
    sent: number;
    completed: number;
    averageCampaignRating: number;
  };
  lastUpdated: string;
}

interface ReviewResponseItem {
  id: string;
  platform: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  responseText: string;
  status: "draft" | "approved" | "published" | "rejected";
  publishedAt: string | null;
  createdAt: string;
}

interface ReviewResponsesData {
  responses: ReviewResponseItem[];
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
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
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  return formatShort(iso);
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400 border-emerald-500";
  if (score >= 60) return "text-yellow-400 border-yellow-500";
  return "text-red-400 border-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Needs improvement";
}

// ── Component ────────────────────────────────────────────────

export function ReputationDashboard() {
  const { toast } = useToast();
  const {
    data: scoreData,
    isLoading: scoreLoading,
  } = useSWR<ScoreResponse>("/api/services/reputation/score", fetcher);

  const {
    data: reviewsData,
    error: reviewsError,
    isLoading: reviewsLoading,
    mutate: mutateReviews,
  } = useSWR<ReviewsResponse>("/api/services/reputation/reviews", fetcher);

  const {
    data: responsesData,
    mutate: mutateResponses,
  } = useSWR<ReviewResponsesData>("/api/services/reputation/responses", fetcher);

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedResponses, setGeneratedResponses] = useState<
    Record<string, string>
  >({});
  const [updatingResponseId, setUpdatingResponseId] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────

  async function handleGenerateResponse(review: Review) {
    setGeneratingId(review.id);
    try {
      const res = await fetch("/api/services/reputation/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          reviewText: review.text,
          reviewAuthor: review.author,
          reviewRating: review.rating,
          platform: review.platform,
        }),
      });
      if (!res.ok) {
        toast("We couldn't generate a response right now. Please try again.", "error");
        return;
      }
      const data = (await res.json()) as { responseText: string };
      setGeneratedResponses((prev) => ({
        ...prev,
        [review.id]: data.responseText,
      }));
      mutateReviews();
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleUpdateResponseStatus(id: string, status: "approved" | "published" | "rejected") {
    setUpdatingResponseId(id);
    try {
      const res = await fetch(`/api/services/reputation/responses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast("We couldn't update the response status. Please try again.", "error");
        return;
      }
      mutateResponses();
    } finally {
      setUpdatingResponseId(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (scoreLoading && reviewsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading reputation data...
        </span>
      </div>
    );
  }

  if (reviewsError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load reputation data. Make sure the service is provisioned.
        </p>
      </div>
    );
  }

  const score = scoreData?.score || {
    averageRating: 0,
    totalReviews: 0,
    responseRate: 0,
    sentimentScore: 0,
    breakdown: { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 },
  };
  const campaigns = scoreData?.campaigns;
  const reviewList = reviewsData?.reviews || [];
  const platforms = reviewsData?.platforms;

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">AI Reputation Shield</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and respond to reviews with AI assistance
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant="default">Active</Badge>
        </div>
      </div>

      {/* Reputation Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Shield className="h-4 w-4" />
            Reputation Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 ${getScoreColor(score.sentimentScore)}`}
                role="meter"
                aria-valuenow={score.sentimentScore}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Sentiment score: ${score.sentimentScore} out of 100, ${getScoreLabel(score.sentimentScore)}`}
              >
                <span className="text-xl font-bold">{score.sentimentScore}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Sentiment Score</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1" aria-label={`Average rating: ${score.averageRating.toFixed(1)} out of 5 stars`}>
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="text-3xl font-bold tabular-nums">
                  {score.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums">{score.totalReviews}</p>
              <p className="mt-2 text-xs text-muted-foreground">Total Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums text-emerald-400">
                {score.responseRate}%
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Response Rate</p>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="mt-6 space-y-2">
            {[
              { label: "5 star", count: score.breakdown.fiveStar },
              { label: "4 star", count: score.breakdown.fourStar },
              { label: "3 star", count: score.breakdown.threeStar },
              { label: "2 star", count: score.breakdown.twoStar },
              { label: "1 star", count: score.breakdown.oneStar },
            ].map((row) => {
              const pct = score.totalReviews > 0 ? (row.count / score.totalReviews) * 100 : 0;
              return (
                <div key={row.label} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-xs text-muted-foreground">{row.label}</span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.label}: ${row.count} reviews, ${Math.round(pct)}%`}
                  >
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-muted-foreground">{row.count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Platform & Campaign Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {platforms && (
          <>
            <Card>
              <CardContent className="pt-1">
                <p className="text-2xl font-bold tabular-nums">{platforms.google}</p>
                <p className="text-xs text-muted-foreground">Google Reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-1">
                <p className="text-2xl font-bold tabular-nums">{platforms.yelp}</p>
                <p className="text-xs text-muted-foreground">Yelp Reviews</p>
              </CardContent>
            </Card>
          </>
        )}
        {campaigns && (
          <>
            <Card>
              <CardContent className="pt-1">
                <p className="text-2xl font-bold tabular-nums">{campaigns.completed}</p>
                <p className="text-xs text-muted-foreground">Campaigns Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-1">
                <p className="text-2xl font-bold tabular-nums">
                  {campaigns.averageCampaignRating.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Campaign Avg Rating</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-4 w-4" />
            Recent Reviews ({reviewList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviewList.length === 0 ? (
            <div className="py-8 text-center">
              <Star className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No reviews yet. Connect your Google Business and Yelp profiles to start monitoring.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewList.map((review) => {
                const hasGenerated = generatedResponses[review.id];
                const displayResponse = hasGenerated || review.responseText;

                return (
                  <div
                    key={review.id}
                    className="rounded-lg border border-border/50 bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{review.author}</p>
                          <StarRating rating={review.rating} />
                          <Badge variant="outline" className="text-xs">
                            {review.platform}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {review.text}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(review.date)}
                        </p>

                        {/* AI Response */}
                        {displayResponse && (
                          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              AI Response
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {displayResponse}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Generate Response Button */}
                      {!displayResponse && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={generatingId === review.id}
                          onClick={() => handleGenerateResponse(review)}
                          aria-label={`Generate AI response to ${review.author}'s review`}
                          className="shrink-0"
                        >
                          {generatingId === review.id ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                              AI Respond
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Review Responses Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4" />
            AI Review Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const pendingResponses = (responsesData?.responses || []).filter(
              (r) => r.status === "draft" || r.status === "approved"
            );
            const publishedResponses = (responsesData?.responses || []).filter(
              (r) => r.status === "published"
            );

            if (pendingResponses.length === 0 && publishedResponses.length === 0) {
              return (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No pending review responses. New responses will be auto-generated when reviews arrive.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {pendingResponses.length > 0 && (
                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      Pending Review ({pendingResponses.length})
                    </p>
                    <div className="space-y-3">
                      {pendingResponses.map((resp) => (
                        <div
                          key={resp.id}
                          className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
                        >
                          <div className="flex items-center gap-2">
                            <StarRating rating={resp.rating} />
                            <span className="font-medium">{resp.reviewerName}</span>
                            <Badge variant="outline" className="text-xs">
                              {resp.platform}
                            </Badge>
                            <Badge
                              variant={resp.status === "approved" ? "default" : "secondary"}
                              className="ml-auto text-xs"
                            >
                              {resp.status === "draft" && <Clock className="mr-1 h-3 w-3" />}
                              {resp.status}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            &quot;{resp.reviewText}&quot;
                          </p>
                          <div className="mt-3 rounded-lg border border-border/50 bg-background p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              AI-Generated Response:
                            </p>
                            <p className="mt-1 text-sm">{resp.responseText}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {resp.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingResponseId === resp.id}
                                onClick={() => handleUpdateResponseStatus(resp.id, "approved")}
                                aria-label={`Approve response to ${resp.reviewerName}'s review`}
                              >
                                {updatingResponseId === resp.id ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                Approve
                              </Button>
                            )}
                            {(resp.status === "draft" || resp.status === "approved") && (
                              <Button
                                size="sm"
                                disabled={updatingResponseId === resp.id}
                                onClick={() => handleUpdateResponseStatus(resp.id, "published")}
                                aria-label={`Publish response to ${resp.reviewerName}'s review`}
                              >
                                {updatingResponseId === resp.id ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Send className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                Publish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              disabled={updatingResponseId === resp.id}
                              onClick={() => handleUpdateResponseStatus(resp.id, "rejected")}
                              aria-label={`Reject response to ${resp.reviewerName}'s review`}
                            >
                              <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {publishedResponses.length > 0 && (
                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      Recently Published ({publishedResponses.length})
                    </p>
                    <div className="space-y-3">
                      {publishedResponses.slice(0, 5).map((resp) => (
                        <div
                          key={resp.id}
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium">{resp.reviewerName}</span>
                            <StarRating rating={resp.rating} />
                            <span className="ml-auto text-xs text-muted-foreground">
                              {resp.publishedAt ? formatDate(resp.publishedAt) : ""}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{resp.responseText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
