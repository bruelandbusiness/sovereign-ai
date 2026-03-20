"use client";

import { useState, useCallback } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-context";

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

interface CommentThreadProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function CommentThread({ postId, comments, onCommentAdded }: CommentThreadProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || submitting) return;

      setSubmitting(true);
      try {
        const res = await fetch(`/api/community/posts/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (!res.ok) throw new Error("Failed to post comment");

        const comment = await res.json();
        onCommentAdded(comment);
        setContent("");
      } catch (error) {
        console.error("Failed to add comment:", error);
        toast("We couldn't post your comment. Please try again.", "error");
      } finally {
        setSubmitting(false);
      }
    },
    [content, submitting, postId, onCommentAdded, toast]
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h3>

      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border/50 bg-muted/20 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">{comment.authorName}</span>
                {comment.authorRole === "admin" && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    <Shield className="h-2.5 w-2.5" aria-hidden="true" />
                    Admin
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="comment-input" className="sr-only">Add a comment</label>
        <textarea
          id="comment-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          aria-label="Add a comment"
          className="w-full rounded-lg border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-y"
          maxLength={5000}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || submitting}
            className="gradient-bg text-white"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
