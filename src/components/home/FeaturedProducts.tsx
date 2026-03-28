"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, Package } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { ProductCard } from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductListItem } from "@/types/products";
import { fetcher } from "@/lib/fetcher";

export function FeaturedProducts() {
  const { data, isLoading, error } = useSWR<{ products: ProductListItem[] }>(
    "/api/products?featured=true&limit=3",
    fetcher,
    {
      dedupingInterval: 30000, // featured products rarely change; avoid re-fetching for 30s
      revalidateOnFocus: false,
    }
  );

  const products = data?.products ?? [];

  return (
    <Section id="products">
      <Container>
        <FadeInView>
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Package className="h-4 w-4" aria-hidden="true" />
              Digital Products
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              AI Tools &amp; <GradientText>Templates</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Production-ready AI infrastructure, revenue automation agents, and
              starter kits. Buy once, deploy instantly.
            </p>
          </div>
        </FadeInView>

        {/* Product cards */}
        <div className="mt-12">
          {error ? (
            <div className="rounded-xl border border-dashed border-destructive/40 p-12 text-center">
              <p className="text-sm text-destructive">
                Failed to load featured products. Please try again later.
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card p-6">
                  <Skeleton className="mb-3 h-5 w-20" />
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <Skeleton className="mb-4 h-4 w-full" />
                  <Skeleton className="mb-4 h-6 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No featured products available at this time.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <FadeInView delay={0.2}>
          <div className="mt-10 text-center">
            <Link href="/products">
              <GradientButton variant="outline" size="lg" aria-label="Browse All Products">
                Browse All Products
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </GradientButton>
            </Link>
          </div>
        </FadeInView>
      </Container>
    </Section>
  );
}
