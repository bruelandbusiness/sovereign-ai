"use client";

import { useState, useEffect, useCallback, use } from "react";
import { ArrowLeft, ThumbsUp, ThumbsDown, BookOpen } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArticleSidebar } from "@/components/knowledge/ArticleSidebar";
import { KB_CATEGORIES } from "@/lib/knowledge-base";

interface ArticleDetail {
  id: string;
  slug: string;
  category: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface RelatedArticle {
  slug: string;
  title: string;
  order: number;
}

function sanitizeHtml(input: string): string {
  // Double-pass approach: strip all HTML tags, then encode any remaining angle brackets.
  // This handles nested/malformed tags that bypass single-regex stripping.
  return input
    .replace(/<[^>]*?>/g, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(content: string): string {
  // Simple markdown-to-HTML renderer for knowledge base articles
  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-foreground/80 leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-sm text-foreground/80 leading-relaxed list-decimal">$1</li>')
    // Paragraphs (blank lines)
    .replace(/\n\n/g, '</p><p class="text-sm text-foreground/80 leading-relaxed mb-3">')
    // Line breaks within paragraphs
    .replace(/\n/g, "<br />");
}

export default function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/knowledge/${slug}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Article not found" : "Failed to load article");
          return;
        }
        const data = await res.json();
        setArticle(data.article);
        setRelatedArticles(data.relatedArticles);
      } catch {
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  const handleFeedback = useCallback((value: "yes" | "no") => {
    setFeedback(value);
    // In a real implementation, this would send the feedback to an API
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex-1 py-8" role="status" aria-live="polite">
          <Container>
            <div className="max-w-5xl mx-auto">
              <div className="skeleton mb-6 h-4 w-36 rounded" />
              <div className="grid gap-8 lg:grid-cols-[1fr_250px]">
                <div>
                  <div className="skeleton mb-4 h-6 w-24 rounded-full" />
                  <div className="skeleton mb-4 h-8 w-3/4 rounded" />
                  <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8 space-y-3">
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-5/6 rounded" />
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-2/3 rounded" />
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="skeleton h-64 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </Container>
          <span className="sr-only">Loading article content, please wait...</span>
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
              <h1 className="text-lg font-semibold mb-2">{error || "Article not found"}</h1>
              <p className="text-sm text-muted-foreground mb-4">
                The article you are looking for may have been moved or does not exist.
              </p>
              <Link
                href="/knowledge"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Back to Help Center
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryMeta = KB_CATEGORIES.find((c) => c.id === article.category);
  const categoryLabel = categoryMeta?.label || article.category;

  // Include current article in sidebar list
  const allCategoryArticles = [
    { slug: article.slug, title: article.title, order: article.order },
    ...relatedArticles,
  ].sort((a, b) => a.order - b.order);

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main id="main-content" className="flex-1 py-8">
        <Container>
          <div className="max-w-5xl mx-auto">
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Help Center
            </Link>

            <div className="grid gap-8 lg:grid-cols-[1fr_250px]">
              {/* Main Content */}
              <article>
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {categoryLabel}
                  </span>
                </div>

                <h1 className="text-2xl font-bold font-display mb-4">{article.title}</h1>

                <Card>
                  <CardContent className="p-6 sm:p-8">
                    <div
                      className="prose-custom text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_li]:ml-4 [&_li]:leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono"
                      dangerouslySetInnerHTML={{
                        __html: `<p class="text-sm text-foreground/80 leading-relaxed mb-3">${renderMarkdown(sanitizeHtml(article.content))}</p>`,
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Feedback */}
                <Card className="mt-6">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between" aria-live="polite">
                      <p className="text-sm font-medium">Was this article helpful?</p>
                      {feedback ? (
                        <p className="text-sm text-muted-foreground">
                          Thanks for your feedback!
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeedback("yes")}
                            aria-label="Yes, this article was helpful"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1.5" aria-hidden="true" />
                            Yes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeedback("no")}
                            aria-label="No, this article was not helpful"
                          >
                            <ThumbsDown className="h-4 w-4 mr-1.5" aria-hidden="true" />
                            No
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                  <nav className="mt-6" aria-label="Related articles">
                    <h2 className="text-sm font-semibold mb-3">Related Articles</h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {relatedArticles.map((ra) => (
                        <Link
                          key={ra.slug}
                          href={`/knowledge/${ra.slug}`}
                          className="rounded-lg border border-border/50 p-3 text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                          {ra.title}
                        </Link>
                      ))}
                    </div>
                  </nav>
                )}
              </article>

              {/* Sidebar - visible on large screens */}
              <aside className="hidden lg:block" aria-label="Category navigation">
                <div className="sticky top-20">
                  <ArticleSidebar
                    category={article.category}
                    categoryLabel={categoryLabel}
                    articles={allCategoryArticles}
                    currentSlug={article.slug}
                  />
                </div>
              </aside>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
