import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { FadeInView } from "@/components/shared/FadeInView";
import { BlogContent } from "@/components/blog/BlogContent";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.metaTitle || `${post.title} | Sovereign AI Blog`,
    description: post.metaDescription || post.excerpt,
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

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main className="flex-1">
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

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                  {post.category.replace("-", " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {post.publishedAt.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>
              <p className="mt-2 text-sm text-muted-foreground">By {post.author}</p>
            </FadeInView>

            <FadeInView delay={0.1}>
              <div className="mx-auto mt-10 max-w-2xl">
                <BlogContent content={post.content} />
              </div>
            </FadeInView>

            <FadeInView delay={0.2}>
              <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                <h3 className="font-display text-lg font-bold">
                  Ready to grow your business with AI?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get a free AI marketing audit and see exactly how we can help.
                </p>
                <Link
                  href="/audit"
                  className="mt-4 inline-block rounded-lg gradient-bg px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Get Your Free Audit
                </Link>
              </div>
            </FadeInView>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
