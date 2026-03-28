"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, BookOpen, Rocket, Zap, CreditCard, Puzzle, Wrench, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleCard } from "@/components/knowledge/ArticleCard";
import { logger } from "@/lib/logger";

interface Article {
  id: string;
  slug: string;
  category: string;
  title: string;
  order: number;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  articles: Article[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  rocket: <Rocket className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  "credit-card": <CreditCard className="h-5 w-5" />,
  puzzle: <Puzzle className="h-5 w-5" />,
  wrench: <Wrench className="h-5 w-5" />,
};

export default function KnowledgePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch("/api/knowledge");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCategories(data.categories);
        setAllArticles(data.articles);
      } catch (error) {
        logger.errorWithCause("Failed to fetch knowledge base", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!search.trim()) {
        setFilteredArticles([]);
        return;
      }
      const query = search.toLowerCase();
      setFilteredArticles(
        allArticles.filter(
          (a) =>
            a.title.toLowerCase().includes(query) ||
            a.category.toLowerCase().includes(query)
        )
      );
    },
    [search, allArticles]
  );

  useEffect(() => {
    if (!search.trim()) {
      setFilteredArticles([]);
    }
  }, [search]);

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main id="main-content" className="flex-1 py-8">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
              </div>
              <h1 className="text-3xl font-bold font-display">Help Center</h1>
              <p className="text-muted-foreground mt-2">
                Find answers, guides, and resources to get the most out of Sovereign AI
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} role="search" aria-label="Search knowledge base" className="mb-8">
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles..."
                  aria-label="Search articles"
                  className="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </form>

            {/* Search Results */}
            <div aria-live="polite" aria-atomic="true">
              {search.trim() && filteredArticles.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                    Search Results ({filteredArticles.length})
                  </h2>
                  <div className="space-y-2">
                    {filteredArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        slug={article.slug}
                        title={article.title}
                        order={article.order}
                      />
                    ))}
                  </div>
                </div>
              )}

              {search.trim() && filteredArticles.length === 0 && (
                <div className="mb-8 text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No articles found matching &quot;{search}&quot;. Try a different search term or browse the categories below.
                  </p>
                </div>
              )}
            </div>

            {/* Category Sections */}
            {loading ? (
              <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
                <div className="text-muted-foreground">Loading articles...</div>
              </div>
            ) : (
              !search.trim() && (
                <div className="space-y-8">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {CATEGORY_ICONS[cat.icon] || <BookOpen className="h-5 w-5" />}
                        </div>
                        <h2 className="text-lg font-semibold">{cat.label}</h2>
                        <span className="text-xs text-muted-foreground">
                          ({cat.articles.length} articles)
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {cat.articles.map((article) => (
                          <ArticleCard
                            key={article.id}
                            slug={article.slug}
                            title={article.title}
                            order={article.order}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Support CTA */}
            <Card className="mt-12 border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <HelpCircle className="mx-auto h-8 w-8 text-primary mb-3" aria-hidden="true" />
                <h2 className="text-sm font-semibold mb-1">
                  Can&apos;t find what you&apos;re looking for?
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Our support team is here to help. Submit a ticket and we&apos;ll get back to you within hours.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/dashboard/support"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                  >
                    Contact Support
                  </Link>
                  <Link
                    href="/community"
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    Ask the Community
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
