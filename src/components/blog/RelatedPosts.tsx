import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RelatedPost {
  slug: string;
  title: string;
  description: string;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <div className="mx-auto mt-16 max-w-2xl">
      <h2 className="font-display text-xl font-bold text-white">
        Related Articles
      </h2>
      <div className="mt-4 space-y-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex items-start gap-3 rounded-lg border border-border bg-card/50 p-4 transition-all duration-200 hover:border-border hover:bg-secondary/50"
          >
            <div className="flex-1">
              <p className="font-medium text-white group-hover:text-primary transition-colors">
                {post.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {post.description}
              </p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
