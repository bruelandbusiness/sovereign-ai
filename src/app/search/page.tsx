"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  FileText,
  HelpCircle,
  BookOpen,
  Wrench,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import type { SearchResult } from "@/lib/search-data";

// ---------------------------------------------------------------------------
// Category icon mapping
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Blog: FileText,
  Help: HelpCircle,
  "Knowledge Base": BookOpen,
  Services: Wrench,
  FAQ: MessageCircle,
};

const CATEGORY_ORDER = ["Blog", "Help", "Knowledge Base", "Services", "FAQ"];

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ResultSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((group) => (
        <div key={group} className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          {[1, 2].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-border/50 bg-card/50 p-4"
            >
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted/60" />
              <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-muted/40" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search results content (reads searchParams)
// ---------------------------------------------------------------------------

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [grouped, setGrouped] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setGrouped({});
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}`
      );
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();
      setResults(data.results ?? []);
      setGrouped(data.grouped ?? {});
      setSearched(true);
    } catch {
      setResults([]);
      setGrouped({});
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch on initial load if query is present
  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      fetchResults(initialQuery);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);

      // Debounce the search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        // Update URL without navigation
        const params = new URLSearchParams();
        if (value.trim()) {
          params.set("q", value.trim());
        }
        const newUrl = value.trim()
          ? `/search?${params.toString()}`
          : "/search";
        router.replace(newUrl, { scroll: false });

        fetchResults(value);
      }, 300);
    },
    [fetchResults, router]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("q", query.trim());
      }
      const newUrl = query.trim()
        ? `/search?${params.toString()}`
        : "/search";
      router.replace(newUrl, { scroll: false });
      fetchResults(query);
    },
    [query, fetchResults, router]
  );

  // Sort grouped results by defined category order
  const sortedCategories = CATEGORY_ORDER.filter(
    (cat) => grouped[cat] && grouped[cat].length > 0
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="border-b border-border/40 bg-muted/20">
          <Container>
            <div className="py-8 sm:py-12">
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Search
              </h1>
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="relative max-w-2xl">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Search blog posts, help articles, services, FAQs..."
                    autoComplete="off"
                    className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </form>
            </div>
          </Container>
        </div>

        <Container>
          <div className="mx-auto max-w-3xl py-8 sm:py-12">
            {/* Loading state */}
            {loading && <ResultSkeleton />}

            {/* Results */}
            {!loading && searched && results.length > 0 && (
              <div className="space-y-8">
                <p className="text-sm text-muted-foreground">
                  {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                  <span className="font-medium text-foreground">
                    &ldquo;{searchParams.get("q") ?? query}&rdquo;
                  </span>
                </p>

                {sortedCategories.map((category) => {
                  const Icon = CATEGORY_ICONS[category] ?? FileText;
                  const items = grouped[category] ?? [];
                  return (
                    <section key={category}>
                      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        {category}
                      </h2>
                      <div className="space-y-2">
                        {items.map((result, idx) => (
                          <Link
                            key={`${category}-${idx}`}
                            href={result.url}
                            className="block rounded-lg border border-border/50 bg-card/50 p-4 transition-all hover:border-primary/30 hover:bg-card"
                          >
                            <h3 className="text-sm font-medium text-foreground">
                              {result.title}
                            </h3>
                            <p
                              className="mt-1 text-xs leading-relaxed text-muted-foreground [&_mark]:bg-primary/20 [&_mark]:text-foreground [&_mark]:rounded-sm [&_mark]:px-0.5"
                              dangerouslySetInnerHTML={{
                                __html: result.excerpt,
                              }}
                            />
                          </Link>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {!loading && searched && results.length === 0 && (
              <div className="py-16 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <h2 className="mt-4 text-lg font-semibold">No results found</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  No matches for &ldquo;{searchParams.get("q") ?? query}
                  &rdquo;. Try a different search term or browse our{" "}
                  <Link
                    href="/help"
                    className="text-primary hover:underline"
                  >
                    help center
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* Initial state (no search yet) */}
            {!loading && !searched && (
              <div className="py-16 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground/20" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Type at least 2 characters to search across blog posts, help
                  articles, services, and FAQs.
                </p>
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense boundary for useSearchParams
// ---------------------------------------------------------------------------

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-background">
          <Header />
          <main className="flex-1">
            <Container>
              <div className="py-16">
                <ResultSkeleton />
              </div>
            </Container>
          </main>
          <Footer />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
