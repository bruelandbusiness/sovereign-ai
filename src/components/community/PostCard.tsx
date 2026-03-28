"use client";

import Link from "next/link";
import { MessageSquare, Pin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  authorName: string;
  commentCount: number;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-muted text-muted-foreground" },
  tips: { label: "Tips & Tricks", color: "bg-blue-500/10 text-blue-400" },
  wins: { label: "Wins", color: "bg-emerald-500/10 text-emerald-400" },
  questions: { label: "Questions", color: "bg-amber-500/10 text-amber-400" },
  feature_requests: { label: "Feature Requests", color: "bg-purple-500/10 text-purple-400" },
};

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

export function PostCard({
  id,
  title,
  content,
  category,
  isPinned,
  authorName,
  commentCount,
  createdAt,
}: PostCardProps) {
  const cat = CATEGORY_LABELS[category] || CATEGORY_LABELS.general;

  return (
    <Link href={`/community/${id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl">
      <Card className="transition-colors hover:border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {isPinned && (
                  <Pin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                )}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.color}`}
                >
                  {cat.label}
                </span>
              </div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                {title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {content}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">{authorName}</span>
                <span>{timeAgo(createdAt)}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">{commentCount} comments</span>
                  <span aria-hidden="true">{commentCount}</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
