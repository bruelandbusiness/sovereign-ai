"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { CategoryFilter } from "@/components/blog/CategoryFilter";
import { Card, CardContent } from "@/components/ui/card";
import { FadeInView } from "@/components/shared/FadeInView";

interface SeedPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  categoryColor: string;
  date: string;
  readTime: string;
}

interface BlogListingClientProps {
  posts: SeedPost[];
}

const CATEGORIES = [
  { value: "case-study", label: "Case Studies" },
  { value: "lead-generation", label: "Lead Generation" },
  { value: "ai-marketing", label: "AI Marketing" },
  { value: "industry-insights", label: "Industry Insights" },
  { value: "local-seo", label: "Local SEO" },
  { value: "review-management", label: "Reviews" },
  { value: "marketing-automation", label: "Automation" },
  { value: "ai-technology", label: "AI Technology" },
  { value: "email-marketing", label: "Email Marketing" },
];

export function BlogListingClient({ posts }: BlogListingClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "all") return posts;
    return posts.filter((p) => p.category === selectedCategory);
  }, [posts, selectedCategory]);

  // Only show categories that have posts
  const activeCategories = useMemo(() => {
    const postCategories = new Set(posts.map((p) => p.category));
    return CATEGORIES.filter((c) => postCategories.has(c.value));
  }, [posts]);

  return (
    <>
      <div className="mx-auto mt-8 max-w-5xl">
        <CategoryFilter
          categories={activeCategories}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post, i) => (
          <FadeInView key={post.slug} delay={i * 0.05}>
            <Link href={`/blog/${post.slug}`} className="group block h-full">
              <Card className="h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                {/* Gradient image placeholder with consistent height */}
                <div className="aspect-[16/9] bg-gradient-to-br from-[#4c85ff]/10 via-transparent to-[#22d3a1]/10 transition-all duration-500 group-hover:from-[#4c85ff]/20 group-hover:to-[#22d3a1]/20" />

                <CardContent className="flex h-[calc(100%-0px)] flex-col p-5">
                  {/* Category + reading time */}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${post.categoryColor}`}
                    >
                      {post.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-base font-semibold leading-snug transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <span className="text-xs text-muted-foreground">
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Read
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </FadeInView>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="mx-auto mt-12 max-w-md text-center">
          <p className="text-muted-foreground">
            No posts in this category yet. Check back soon.
          </p>
          <button
            onClick={() => setSelectedCategory("all")}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            View all posts
          </button>
        </div>
      )}
    </>
  );
}
