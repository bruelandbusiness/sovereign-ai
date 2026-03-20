"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Share2,
  Plus,
  Sparkles,
  Calendar,
  Heart,
  MessageCircle,
  Loader2,
  Clock,
  CheckCircle2,
  Send,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// ── Types ────────────────────────────────────────────────────

interface SocialPost {
  id: string;
  content: string;
  platform: "facebook" | "instagram" | "linkedin" | "twitter";
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt: string | null;
  publishedAt: string | null;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

interface PostsResponse {
  posts: SocialPost[];
  isMock: boolean;
}

// ── Fetcher ──────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ── Helpers ──────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  linkedin: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  twitter: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  scheduled: "secondary",
  published: "default",
  failed: "destructive",
};

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getWeekDays(): { label: string; date: string }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days: { label: string; date: string }[] = [];
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      label: dayLabels[i],
      date: d.toISOString().split("T")[0],
    });
  }
  return days;
}

// ── Component ────────────────────────────────────────────────

export function SocialDashboard() {
  const {
    data: postsResponse,
    isLoading,
    mutate,
  } = useSWR<PostsResponse>("/api/services/social/posts", fetcher);

  const [showComposer, setShowComposer] = useState(false);
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<SocialPost["platform"]>("facebook");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const postList = postsResponse?.posts || [];
  const isMock = postsResponse?.isMock || false;
  const totalPosts = postList.length;
  const scheduledPosts = postList.filter((p) => p.status === "scheduled").length;
  const publishedPosts = postList.filter((p) => p.status === "published");
  const avgEngagement =
    publishedPosts.length > 0
      ? Math.round(
          publishedPosts.reduce((sum, p) => sum + p.likes + p.comments + p.shares, 0) /
            publishedPosts.length
        )
      : 0;

  const weekDays = getWeekDays();

  // ── Handlers ─────────────────────────────────────────────

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/services/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          platform,
          scheduledAt: scheduleDate || undefined,
        }),
      });
      if (res.ok) {
        setContent("");
        setScheduleDate("");
        setShowComposer(false);
        mutate();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/services/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || "AI-generated social media post content.");
      }
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading social media...</span>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
            <Share2 className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Social Media</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered social content and scheduling
            </p>
          </div>
        </div>
        <Button onClick={() => setShowComposer(!showComposer)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Sample Data Banner */}
      {isMock && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200 flex items-center gap-2 mb-4" role="status">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sample Data — Connect your social media accounts to publish posts</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Share2 className="h-4 w-4" />
              <p className="text-xs">Total Posts</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totalPosts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <p className="text-xs">Scheduled</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-yellow-400">
              {scheduledPosts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <p className="text-xs">Avg Engagement</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-pink-400">
              {avgEngagement}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Post Composer */}
      {showComposer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Compose Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-content">Content</Label>
                <Textarea
                  id="post-content"
                  placeholder="What do you want to share?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="post-platform">Platform</Label>
                  <select
                    id="post-platform"
                    value={platform}
                    onChange={(e) =>
                      setPlatform(e.target.value as SocialPost["platform"])
                    }
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    aria-label="Select social media platform"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter / X</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-schedule">Schedule Date</Label>
                  <Input
                    id="post-schedule"
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-4 w-4" />
                      {scheduleDate ? "Schedule Post" : "Post Now"}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      AI Generate
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComposer(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="h-4 w-4" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2" role="list" aria-label="Posts this week by day">
            {weekDays.map((day) => {
              const dayPosts = postList.filter((p) => {
                const postDate = p.scheduledAt || p.publishedAt || p.createdAt;
                return postDate?.startsWith(day.date);
              });
              return (
                <div
                  key={day.date}
                  className="rounded-lg border border-white/[0.06] bg-secondary/50 p-2 text-center"
                  role="listitem"
                  aria-label={`${day.label}: ${dayPosts.length} post${dayPosts.length !== 1 ? "s" : ""}`}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {day.label}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums">
                    {dayPosts.length}
                  </p>
                  {dayPosts.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {dayPosts.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            p.status === "published"
                              ? "bg-emerald-400"
                              : p.status === "scheduled"
                                ? "bg-yellow-400"
                                : "bg-muted-foreground"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Post Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Posts ({postList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postList.length === 0 ? (
            <div className="py-8 text-center">
              <Share2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No posts yet. Create your first social media post.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {postList.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-border/50 bg-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            PLATFORM_COLORS[post.platform] || ""
                          }`}
                        >
                          {post.platform}
                        </span>
                        <Badge variant={STATUS_VARIANT[post.status] || "outline"}>
                          {post.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed">{post.content}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        {post.status === "scheduled" && post.scheduledAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(post.scheduledAt)}
                          </span>
                        )}
                        {post.status === "published" && (
                          <>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              <span>Published {formatDate(post.publishedAt)}</span>
                            </span>
                            <span className="flex items-center gap-1" aria-label={`${post.likes} likes`}>
                              <Heart className="h-3 w-3" aria-hidden="true" />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1" aria-label={`${post.comments} comments`}>
                              <MessageCircle className="h-3 w-3" aria-hidden="true" />
                              {post.comments}
                            </span>
                            <span className="flex items-center gap-1" aria-label={`${post.shares} shares`}>
                              <Share2 className="h-3 w-3" aria-hidden="true" />
                              {post.shares}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
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
