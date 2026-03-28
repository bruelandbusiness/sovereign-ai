"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    author: string;
    publishedAt: Date;
    readingTime?: number;
    image?: string;
  };
  index?: number;
}

const categoryColors: Record<string, string> = {
  "ai-marketing": "bg-[#4c85ff]/10 text-[#4c85ff]",
  "lead-generation": "bg-blue-500/10 text-blue-400",
  reviews: "bg-amber-500/10 text-amber-400",
  chatbots: "bg-cyan-500/10 text-cyan-400",
  roi: "bg-[#22d3a1]/10 text-[#22d3a1]",
};

export function BlogCard({ post, index = 0 }: BlogCardProps) {
  const colorClass =
    categoryColors[post.category] || "bg-white/[0.06] text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <article className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-lg hover:shadow-[#4c85ff]/5">
          {/* Image placeholder */}
          {post.image ? (
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-[#4c85ff]/10 via-transparent to-[#22d3a1]/10" />
          )}

          <div className="flex flex-1 flex-col p-5">
            {/* Category + reading time */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  colorClass,
                )}
              >
                {post.category.replace("-", " ")}
              </span>
              {post.readingTime && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {post.readingTime} min
                </span>
              )}
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
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#4c85ff] to-[#22d3a1] text-[9px] font-bold text-white">
                  {post.author
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <span className="text-xs text-muted-foreground">
                  {post.author}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Read
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
