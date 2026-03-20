"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Globe,
  Clock,
  Eye,
  Search,
  PhoneCall,
  Navigation,
  Star,
  Image,
  TrendingUp,
  TrendingDown,
  Loader2,
  Sparkles,
  Save,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ────────────────────────────────────────────────────

interface BusinessHours {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface BusinessInfo {
  name: string;
  description: string;
  phone: string;
  website: string;
  address: string;
  category: string;
  hours: BusinessHours[];
}

interface BusinessInsights {
  views: number;
  searches: number;
  calls: number;
  directionRequests: number;
  websiteClicks: number;
  photoViews: number;
  viewsTrend: number;
  searchesTrend: number;
  callsTrend: number;
  directionsTrend: number;
}

interface GBPReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  responseText?: string;
}

interface GBPPhoto {
  id: string;
  url: string;
  category: string;
  uploadedAt: string;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3 w-3" aria-hidden="true" />
      )}
      <span className="sr-only">{isPositive ? "Up" : "Down"}</span>
      {Math.abs(value)}%
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${
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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Component ────────────────────────────────────────────────

export function GBPDashboard() {
  const swrOpts = { refreshInterval: 60000, dedupingInterval: 10000, revalidateOnFocus: false } as const;

  const { data: profileData, isLoading: profileLoading } = useSWR<{
    profile: BusinessInfo;
  }>("/api/services/gbp", fetcher, swrOpts);

  const { data: insightsData } = useSWR<{
    insights: BusinessInsights;
  }>("/api/services/gbp/insights", fetcher, swrOpts);

  const { data: reviewsData } = useSWR<{
    reviews: GBPReview[];
  }>("/api/services/gbp/reviews", fetcher, swrOpts);

  const { data: photosData } = useSWR<{
    photos: GBPPhoto[];
  }>("/api/services/gbp/photos", fetcher, swrOpts);

  const { data: hoursData, mutate: mutateHours } = useSWR<{
    hours: BusinessHours[];
  }>("/api/services/gbp/hours", fetcher, swrOpts);

  const [editingHours, setEditingHours] = useState(false);
  const [localHours, setLocalHours] = useState<BusinessHours[]>([]);
  const [savingHours, setSavingHours] = useState(false);
  const [generatingResponseFor, setGeneratingResponseFor] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────

  function handleEditHours() {
    setLocalHours(hoursData?.hours || []);
    setEditingHours(true);
  }

  async function handleSaveHours() {
    setSavingHours(true);
    try {
      await fetch("/api/services/gbp/hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: localHours }),
      });
      mutateHours();
      setEditingHours(false);
    } finally {
      setSavingHours(false);
    }
  }

  async function handleGenerateResponse(review: GBPReview) {
    setGeneratingResponseFor(review.id);
    try {
      await fetch("/api/services/gbp/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          reviewerName: review.author,
          rating: review.rating,
          reviewText: review.text,
        }),
      });
    } finally {
      setGeneratingResponseFor(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="ml-2 text-muted-foreground">
          Loading Google Business Profile...
        </span>
      </div>
    );
  }

  const profile = profileData?.profile;
  const insights = insightsData?.insights;
  const reviews = reviewsData?.reviews || [];
  const photos = photosData?.photos || [];
  const hours = hoursData?.hours || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon-sm" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <MapPin className="h-5 w-5 text-blue-400" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Google Business Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your Google Business Profile listing
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant="default">Connected</Badge>
        </div>
      </div>

      {/* Profile Overview */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">{profile.category}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.address}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  {profile.website}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Cards */}
      {insights && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <TrendBadge value={insights.viewsTrend} />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {insights.views.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Profile Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <Search className="h-4 w-4 text-muted-foreground" />
                <TrendBadge value={insights.searchesTrend} />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {insights.searches.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Search Appearances</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
                <TrendBadge value={insights.callsTrend} />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{insights.calls}</p>
              <p className="text-xs text-muted-foreground">Phone Calls</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-1">
              <div className="flex items-center justify-between">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <TrendBadge value={insights.directionsTrend} />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {insights.directionRequests}
              </p>
              <p className="text-xs text-muted-foreground">Direction Requests</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4" />
              Business Hours
            </CardTitle>
            {!editingHours ? (
              <Button size="sm" variant="outline" onClick={handleEditHours}>
                Edit Hours
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingHours(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" disabled={savingHours} onClick={handleSaveHours}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {savingHours ? "Saving Hours..." : "Save Hours"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(editingHours ? localHours : hours).map((h, idx) => (
              <div
                key={h.day}
                className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
              >
                <span className="w-28 text-sm font-medium capitalize">
                  {h.day.toLowerCase()}
                </span>
                {editingHours ? (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={h.isClosed}
                        onChange={() => {
                          const updated = [...localHours];
                          updated[idx] = { ...h, isClosed: !h.isClosed };
                          setLocalHours(updated);
                        }}
                        className="rounded"
                        aria-label={`Mark ${h.day.toLowerCase()} as closed`}
                      />
                      Closed
                    </label>
                    {!h.isClosed && (
                      <>
                        <input
                          type="time"
                          value={h.openTime}
                          onChange={(e) => {
                            const updated = [...localHours];
                            updated[idx] = { ...h, openTime: e.target.value };
                            setLocalHours(updated);
                          }}
                          className="rounded border border-border bg-background px-2 py-1 text-sm"
                          aria-label={`${h.day.toLowerCase()} opening time`}
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={h.closeTime}
                          onChange={(e) => {
                            const updated = [...localHours];
                            updated[idx] = { ...h, closeTime: e.target.value };
                            setLocalHours(updated);
                          }}
                          className="rounded border border-border bg-background px-2 py-1 text-sm"
                          aria-label={`${h.day.toLowerCase()} closing time`}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {h.isClosed ? "Closed" : `${h.openTime} - ${h.closeTime}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Star className="h-4 w-4" />
            Google Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No Google reviews found yet. Reviews will appear here once your Google Business Profile is connected and customers leave feedback.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border/50 bg-muted/20 p-4"
                >
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{review.author}</p>
                    <StarRating rating={review.rating} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.text}
                  </p>
                  {review.responseText ? (
                    <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <p className="text-xs font-medium text-emerald-400">
                        Your Response
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {review.responseText}
                      </p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      disabled={generatingResponseFor === review.id}
                      onClick={() => handleGenerateResponse(review)}
                    >
                      {generatingResponseFor === review.id ? (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Image className="h-4 w-4" aria-hidden="true" />
            Photos ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No photos uploaded yet. Add photos of your work, team, or storefront to attract more customers.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-lg border border-border/50"
                >
                  <div className="aspect-square bg-muted/30">
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
                      <span className="sr-only">{photo.category} photo</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <Badge variant="secondary" className="text-xs">
                      {photo.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
