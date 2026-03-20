"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

interface ArticleCardProps {
  slug: string;
  title: string;
  order: number;
}

export function ArticleCard({ slug, title, order }: ArticleCardProps) {
  return (
    <Link
      href={`/knowledge/${slug}`}
      className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
        {order}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">
          {title}
        </p>
      </div>
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
    </Link>
  );
}
