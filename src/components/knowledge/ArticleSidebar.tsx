"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarArticle {
  slug: string;
  title: string;
  order: number;
}

interface ArticleSidebarProps {
  category: string;
  categoryLabel: string;
  articles: SidebarArticle[];
  currentSlug: string;
}

export function ArticleSidebar({
  categoryLabel,
  articles,
  currentSlug,
}: ArticleSidebarProps) {
  return (
    <nav className="rounded-lg border border-border/50 bg-card p-4" aria-label={`${categoryLabel} articles`}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {categoryLabel}
      </h2>
      <ul className="space-y-1">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/knowledge/${article.slug}`}
              aria-current={article.slug === currentSlug ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors",
                article.slug === currentSlug
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
