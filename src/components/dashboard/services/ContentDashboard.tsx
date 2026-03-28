"use client";

import { useState } from "react";
import useSWR from "swr";
import { formatShort } from "@/lib/date-utils";
import {
  FileText,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContentJob {
  id: string;
  clientId: string;
  type: string;
  title: string | null;
  content: string | null;
  keywords: string | null;
  status: string;
  publishAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  queued: {
    label: "Queued",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    icon: Clock,
  },
  generating: {
    label: "Generating",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Loader2,
  },
  published: {
    label: "Published",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: AlertCircle,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <Icon
        className={`h-3 w-3 ${status === "generating" ? "animate-spin" : ""}`}
      />
      {config.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  return formatShort(dateStr);
}

export function ContentDashboard() {
  const {
    data: posts,
    error,
    isLoading,
    mutate,
  } = useSWR<ContentJob[]>("/api/services/content/posts", fetcher);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPosts = posts?.length ?? 0;
  const publishedCount =
    posts?.filter((p) => p.status === "published").length ?? 0;
  const queuedCount =
    posts?.filter((p) => p.status === "queued").length ?? 0;

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/services/content/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          keywords: keywords.trim() || undefined,
        }),
      });

      if (res.ok) {
        setTitle("");
        setKeywords("");
        setShowForm(false);
        mutate();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerate(jobId: string) {
    setGeneratingId(jobId);
    try {
      const res = await fetch("/api/services/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (res.ok) {
        mutate();
      }
    } finally {
      setGeneratingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading content engine...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm text-muted-foreground">
            Failed to load content data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Content Engine</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered blog posts and SEO content
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Posts</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {totalPosts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
              {publishedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Queued</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-yellow-400">
              {queuedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* New Post Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Queue a New Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-title">Post Title</Label>
                <Input
                  id="post-title"
                  placeholder="e.g. 10 Tips for Choosing the Right Plumber"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-keywords">
                  Target Keywords{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional, comma-separated)
                  </span>
                </Label>
                <Input
                  id="post-keywords"
                  placeholder="e.g. plumber near me, emergency plumbing, drain repair"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Queuing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add to Queue
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {!posts || posts.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No content jobs yet. Queue your first post to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const isExpanded = expandedId === post.id;
                const isGenerating = generatingId === post.id;

                return (
                  <div
                    key={post.id}
                    className="rounded-lg border border-border/50 bg-muted/20 transition-colors"
                  >
                    {/* Post row */}
                    <div className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {post.title || "Untitled"}
                          </p>
                          <StatusBadge status={post.status} />
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="capitalize">{post.type}</span>
                          {post.keywords && (
                            <>
                              <span className="text-border">|</span>
                              <span className="truncate">
                                {post.keywords}
                              </span>
                            </>
                          )}
                          <span className="text-border">|</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {post.status === "queued" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerate(post.id)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Generate Now
                              </>
                            )}
                          </Button>
                        )}

                        {post.status === "published" && post.content && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : post.id)
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && post.content && (
                      <div className="border-t border-border/50 px-4 py-4">
                        <div className="prose prose-sm prose-invert max-w-none">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                            {post.content}
                          </div>
                        </div>
                        {post.publishAt && (
                          <p className="mt-4 text-xs text-muted-foreground">
                            Published on {formatDate(post.publishAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
