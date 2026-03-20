"use client";

import { useState, useEffect, useCallback, use } from "react";
import { ArrowLeft, Pin, Trash2, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommentThread } from "@/components/community/CommentThread";
import { useSession } from "@/lib/auth-context";

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  comments: Comment[];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-slate-500/10 text-slate-400" },
  tips: { label: "Tips & Tricks", color: "bg-blue-500/10 text-blue-400" },
  wins: { label: "Wins", color: "bg-emerald-500/10 text-emerald-400" },
  questions: { label: "Questions", color: "bg-amber-500/10 text-amber-400" },
  feature_requests: { label: "Feature Requests", color: "bg-purple-500/10 text-purple-400" },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isLoading: sessionLoading } = useSession();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;

    async function fetchPost() {
      try {
        const res = await fetch(`/api/community/posts/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Post not found");
          } else {
            setError("Failed to load post");
          }
          return;
        }
        const data = await res.json();
        setPost(data);
      } catch {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, sessionLoading]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/community/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/community");
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  }, [id, router]);

  const handleTogglePin = useCallback(async () => {
    if (!post) return;

    try {
      const res = await fetch(`/api/community/posts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !post.isPinned }),
      });
      if (!res.ok) throw new Error("Failed to toggle pin");
      setPost({ ...post, isPinned: !post.isPinned });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  }, [post, id]);

  const handleCommentAdded = useCallback(
    (comment: Comment) => {
      if (!post) return;
      setPost({ ...post, comments: [...post.comments, comment] });
    },
    [post]
  );

  if (sessionLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8" role="status" aria-label="Loading post">
          <Container>
            <div className="max-w-3xl mx-auto">
              <div className="skeleton mb-6 h-4 w-32 rounded" />
              <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
                <div className="skeleton h-7 w-3/4 rounded" />
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-4 w-32 rounded" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-border/50 bg-card p-6">
                <div className="skeleton h-5 w-24 rounded mb-4" />
                <div className="skeleton h-20 w-full rounded" />
              </div>
            </div>
          </Container>
          <span className="sr-only">Loading post content, please wait...</span>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="alert">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-lg font-semibold mb-2">{error || "Post not found"}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                The post you are looking for may have been removed or does not exist.
              </p>
              <Link href="/community">
                <Button variant="outline" size="sm">
                  Back to Community
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const cat = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.general;
  const isAuthor = user?.id === post.authorId;
  const isAdmin = user?.role === "admin";
  const canDelete = isAuthor || isAdmin;

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          <div className="max-w-3xl mx-auto">
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Community
            </Link>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  {post.isPinned && (
                    <Pin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  )}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.color}`}
                  >
                    {cat.label}
                  </span>
                </div>

                <h1 className="text-xl font-bold mb-2">{post.title}</h1>

                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/70">
                    {post.authorName}
                  </span>
                  {post.authorRole === "admin" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <Shield className="h-2.5 w-2.5" aria-hidden="true" />
                      Admin
                    </span>
                  )}
                  <span>{formatDate(post.createdAt)}</span>
                </div>

                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Admin / Author Actions */}
                {(canDelete || isAdmin) && (
                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2">
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTogglePin}
                      >
                        <Pin className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                        {post.isPinned ? "Unpin" : "Pin"}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 hover:border-red-400/50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardContent className="p-6">
                <CommentThread
                  postId={post.id}
                  comments={post.comments}
                  onCommentAdded={handleCommentAdded}
                />
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
