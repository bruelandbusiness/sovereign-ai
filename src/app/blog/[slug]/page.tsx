import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { BlogContent } from "@/components/blog/BlogContent";
import { BlogScrollTracker } from "@/components/blog/BlogScrollTracker";
import { SocialShare } from "@/components/blog/SocialShare";
import { NewsletterCTA } from "@/components/blog/NewsletterCTA";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { prisma } from "@/lib/db";

/* Revalidate every hour -- blog posts don't change frequently */
export const revalidate = 3600;

/** Estimate reading time from content (average 230 words per minute). */
function estimateReadingTime(content: string): number {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 230));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      url: `/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) notFound();

  const readingTime = estimateReadingTime(post.content);

  /* Fetch related posts from the same category (excluding current post) */
  let relatedPosts: { slug: string; title: string; excerpt: string }[] = [];
  try {
    relatedPosts = await prisma.blogPost.findMany({
      where: {
        category: post.category,
        slug: { not: slug },
      },
      select: { slug: true, title: true, excerpt: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
  } catch {
    // Gracefully handle if the query fails
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <BlogScrollTracker slug={slug} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          url: `https://www.trysovereignai.com/blog/${slug}`,
          datePublished: post.publishedAt.toISOString(),
          wordCount: post.content.split(/\s+/).filter(Boolean).length,
          author: {
            "@type": "Person",
            name: post.author,
          },
          publisher: {
            "@type": "Organization",
            name: "Sovereign AI",
            url: "https://www.trysovereignai.com",
            logo: {
              "@type": "ImageObject",
              url: "https://www.trysovereignai.com/icon-512.png",
            },
          },
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${slug}` },
        ]}
      />
      <Header />

      <main id="main-content" className="flex-1">
        <Section>
          <Container size="md">
            <FadeInView>
              <Link
                href="/blog"
                className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Posts
              </Link>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 font-medium text-primary">
                  {post.category.replace("-", " ")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {post.publishedAt.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readingTime} min read
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                {post.excerpt}
              </p>

              {/* Author + social share row */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#4c85ff] to-[#22d3a1] text-[10px] font-bold text-white">
                    {post.author
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <span>By {post.author}</span>
                </div>
                <SocialShare
                  url={`/blog/${slug}`}
                  title={post.title}
                />
              </div>
            </FadeInView>

            <FadeInView delay={0.1}>
              <div className="mx-auto mt-10 max-w-2xl">
                <BlogContent content={post.content} />

                {/* Newsletter CTA mid-article */}
                <NewsletterCTA />
              </div>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-6 text-center sm:p-8">
                <h3 className="font-display text-lg font-bold sm:text-xl">
                  How Many Leads Are You Losing Every Month?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our free AI audit scans your online presence in 60 seconds and
                  shows you exactly where competitors are beating you. Over
                  2,300 contractors have used it to find $5K&ndash;$50K in
                  missed revenue.
                </p>
                <Link
                  href="/free-audit"
                  className="mt-4 inline-block rounded-lg gradient-bg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Get My Free AI Marketing Audit &rarr;
                </Link>
                <p className="mt-3 text-xs text-muted-foreground">
                  Free forever &middot; No credit card &middot; Results in 60
                  seconds
                </p>
              </div>
            </FadeInView>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <FadeInView delay={0.3}>
                <RelatedPosts
                  posts={relatedPosts.map((p) => ({
                    slug: p.slug,
                    title: p.title,
                    description: p.excerpt,
                  }))}
                />
              </FadeInView>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
