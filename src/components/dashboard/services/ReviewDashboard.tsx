"use client";

import { useState } from "react";
import useSWR from "swr";
import { Star, Send, Mail, BarChart3, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  sent: "secondary",
  reminded: "secondary",
  completed: "default",
  opted_out: "destructive",
};

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReviewDashboard() {
  const {
    data: campaigns,
    isLoading,
    mutate,
  } = useSWR<ReviewCampaign[]>("/api/services/reviews/campaigns", fetcher);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const campaignList = campaigns || [];

  // Stats
  const totalSent = campaignList.filter(
    (c) => c.status !== "pending"
  ).length;
  const totalCompleted = campaignList.filter(
    (c) => c.status === "completed"
  ).length;
  const ratingsWithValues = campaignList
    .filter((c) => c.rating !== null)
    .map((c) => c.rating as number);
  const avgRating =
    ratingsWithValues.length > 0
      ? (
          ratingsWithValues.reduce((a, b) => a + b, 0) /
          ratingsWithValues.length
        ).toFixed(1)
      : "--";

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
        alert(data.error || "Failed to send review request.");
        return;
      }

      mutate();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSendingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading review campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Automation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send review requests to your customers and track responses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Send className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalSent}</p>
              <p className="text-xs text-muted-foreground">Requests Sent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Reviews Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{avgRating}</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Campaign Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Review Campaign
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="customerName"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Customer Name *
                </label>
                <Input
                  id="customerName"
                  placeholder="Jane Smith"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="customerEmail"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Customer Email *
                </label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="jane@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="reviewUrl"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Review URL
                </label>
                <Input
                  id="reviewUrl"
                  type="url"
                  placeholder="https://g.page/r/..."
                  value={reviewUrl}
                  onChange={(e) => setReviewUrl(e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Campaign"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns ({campaignList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No campaigns yet. Create your first review campaign above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Email
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
                  {campaignList.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {campaign.customerName}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {campaign.customerEmail}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            STATUS_BADGE_VARIANT[campaign.status] || "outline"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatDate(campaign.sentAt)}
                      </td>
                      <td className="py-3 pr-4">
                        {campaign.rating !== null ? (
                          <span className="flex items-center gap-1 font-medium text-amber-400">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {campaign.rating}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="py-3">
                        {campaign.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sendingId === campaign.id}
                            onClick={() => handleSendRequest(campaign.id)}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            {sendingId === campaign.id
                              ? "Sending..."
                              : "Send Request"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
