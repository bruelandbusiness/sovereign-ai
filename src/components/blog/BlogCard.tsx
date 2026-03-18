import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    author: string;
    publishedAt: Date;
  };
}

const categoryColors: Record<string, string> = {
  "ai-marketing": "bg-primary/10 text-primary",
  "lead-generation": "bg-blue-500/10 text-blue-400",
  reviews: "bg-amber-500/10 text-amber-400",
  chatbots: "bg-cyan-500/10 text-cyan-400",
  roi: "bg-accent/10 text-accent",
};

export function BlogCard({ post }: BlogCardProps) {
  const colorClass = categoryColors[post.category] || "bg-muted text-muted-foreground";

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="flex h-full flex-col p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${colorClass}`}>
              {post.category.replace("-", " ")}
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug">{post.title}</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
            {post.excerpt}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
            <span className="text-xs text-muted-foreground">
              {post.publishedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-primary">
              Read
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
