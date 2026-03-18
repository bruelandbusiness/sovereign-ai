import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { BlogCard } from "@/components/blog/BlogCard";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Blog | Sovereign AI",
  description:
    "AI marketing tips, case studies, and strategies for home service businesses. Learn how to grow your business with AI.",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main className="flex-1">
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  The Sovereign AI <GradientText>Blog</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  AI marketing strategies, tips, and insights for local service
                  businesses.
                </p>
              </div>
            </FadeInView>

            {posts.length === 0 ? (
              <FadeInView delay={0.1}>
                <p className="mt-12 text-center text-muted-foreground">
                  Blog posts coming soon. Check back later!
                </p>
              </FadeInView>
            ) : (
              <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, i) => (
                  <FadeInView key={post.id} delay={i * 0.05}>
                    <BlogCard post={post} />
                  </FadeInView>
                ))}
              </div>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
