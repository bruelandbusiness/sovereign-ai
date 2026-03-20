"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { AnimatePresence } from "framer-motion";
import { Search, Package, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { ProductCard } from "@/components/products/ProductCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductListItem } from "@/types/products";
import { CATEGORY_LABELS } from "@/types/products";
import { fetcher } from "@/lib/fetcher";

const TIER_FILTERS: { value: string; label: string; description: string }[] = [
  { value: "all", label: "All Products", description: "Browse everything" },
  { value: "infrastructure", label: "Infrastructure", description: "$500+" },
  { value: "revenue_engine", label: "Revenue Engines", description: "$100-$1K" },
  { value: "saas_lite", label: "SaaS-Lite", description: "$20-$150" },
];

const CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filters from URL
  const [activeTier, setActiveTier] = useState(searchParams.get("tier") || "all");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build API URL with filters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (activeTier !== "all") params.set("tier", activeTier);
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("limit", "50");
    const qs = params.toString();
    return `/api/products${qs ? `?${qs}` : ""}`;
  }, [activeTier, activeCategory, debouncedSearch]);

  // Update URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTier !== "all") params.set("tier", activeTier);
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (debouncedSearch) params.set("search", debouncedSearch);
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [activeTier, activeCategory, debouncedSearch, router]);

  const { data, isLoading, error } = useSWR<{ products: ProductListItem[] }>(apiUrl, fetcher, {
    keepPreviousData: true,
    dedupingInterval: 10000, // avoid duplicate requests for 10 seconds
  });

  const products = data?.products ?? [];

  const handleTierChange = useCallback((tier: string) => {
    setActiveTier(tier);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden page-enter">
      <Header />

      <main>
        {/* Hero Section */}
        <Section className="relative overflow-hidden pb-8 pt-20 sm:pb-12 sm:pt-28">
          <GradientOrb position="top-left" size="lg" color="primary" />
          <GradientOrb position="top-right" size="md" color="accent" />
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  AI <GradientText>Digital Products</GradientText>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  Enterprise-grade AI tools, agents, and templates.
                  Built for businesses that want to lead, not follow.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Trust Bar */}
        <FadeInView>
          <div className="border-y border-border/40 bg-white/[0.02]">
            <Container>
              <div className="flex flex-wrap items-center justify-center gap-4 py-4 sm:gap-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="font-semibold text-foreground">{products.length || "--"}</span> Products
                </div>
                <div className="hidden h-4 w-px bg-border/60 sm:block" aria-hidden="true" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">2,000+</span> Sales
                </div>
                <div className="hidden h-4 w-px bg-border/60 sm:block" aria-hidden="true" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">4.8</span> Avg Rating
                </div>
                <div className="hidden h-4 w-px bg-border/60 sm:block" aria-hidden="true" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">60-Day</span> Money-Back Guarantee
                </div>
              </div>
            </Container>
          </div>
        </FadeInView>

        {/* Filters + Grid */}
        <Section className="pt-8 sm:pt-12">
          <Container>
            {/* Search */}
            <FadeInView>
              <div className="mx-auto mb-8 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <label htmlFor="product-search" className="sr-only">Search products</label>
                  <Input
                    id="product-search"
                    placeholder="Search products, tech stacks, or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-11 pl-10 text-sm"
                    type="search"
                  />
                </div>
              </div>
            </FadeInView>

            {/* Tier filter tabs */}
            <FadeInView delay={0.1}>
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Filter by tier">
                {TIER_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleTierChange(filter.value)}
                    aria-pressed={activeTier === filter.value}
                    className={`
                      inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                      ${
                        activeTier === filter.value
                          ? "gradient-bg text-white shadow-md"
                          : "border border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }
                    `}
                  >
                    {filter.label}
                    <span className={`text-xs ${activeTier === filter.value ? "text-white/80" : "text-muted-foreground/60"}`}>
                      {filter.description}
                    </span>
                  </button>
                ))}
              </div>
            </FadeInView>

            {/* Category filter pills */}
            <FadeInView delay={0.15}>
              <div className="mb-10 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Filter by category">
                {CATEGORY_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleCategoryChange(filter.value)}
                    aria-pressed={activeCategory === filter.value}
                    className={`
                      rounded-full px-3 py-1 text-xs font-medium transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                      ${
                        activeCategory === filter.value
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }
                    `}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </FadeInView>

            {/* Product Grid */}
            {isLoading && !data ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading products">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/60 bg-card p-6">
                    <Skeleton className="mb-3 h-5 w-20" />
                    <Skeleton className="mb-2 h-6 w-3/4" />
                    <Skeleton className="mb-4 h-4 w-full" />
                    <Skeleton className="mb-4 h-4 w-1/2" />
                    <Skeleton className="mb-4 h-6 w-24" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-dashed border-destructive/40 p-12 text-center" role="alert">
                <p className="text-sm text-destructive">
                  Failed to load products. Please try again later.
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-12 text-center" role="status">
                <SlidersHorizontal className="mx-auto h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No products match your filters. Try adjusting your search or filters.
                </p>
                <button
                  onClick={() => {
                    setActiveTier("all");
                    setActiveCategory("all");
                    setSearchQuery("");
                  }}
                  className="mt-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
                aria-label={`${products.length} products`}
              >
                <AnimatePresence mode="popLayout">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
