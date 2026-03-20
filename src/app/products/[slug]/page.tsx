"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useSession } from "@/lib/auth-context";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FileText,
  Key,
  Shield,
  Users,
  Package,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { TierBadge } from "@/components/products/TierBadge";
import { ProductPriceDisplay } from "@/components/products/ProductPriceDisplay";
import { StarRating } from "@/components/products/StarRating";
import { ProductReviews } from "@/components/products/ProductReviews";
import { ProductCard } from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetail, ProductListItem } from "@/types/products";
import { TIER_LABELS, TIER_CONFIG, CATEGORY_LABELS } from "@/types/products";
import { fetcher } from "@/lib/fetcher";

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const deliveryIcons: Record<string, { icon: typeof Download; label: string; description: string }> = {
  download: { icon: Download, label: "Instant Download", description: "Downloadable guide & documentation (Markdown)" },
  access: { icon: Download, label: "Instant Download", description: "Downloadable strategy playbook (Markdown)" },
  api_key: { icon: Download, label: "Instant Download", description: "Downloadable guide & documentation (Markdown)" },
  github: { icon: Download, label: "Instant Download", description: "Downloadable implementation guide (Markdown)" },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useSession();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleBuyNow() {
    if (!user) {
      router.push(`/login?redirect=/products/${slug}`);
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch(`/api/products/${slug}/checkout`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (!isSafeUrl(url)) {
        throw new Error("Invalid checkout URL");
      }
      window.location.href = url;
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setCheckoutLoading(false);
    }
  }

  const { data, isLoading, error } = useSWR<{ product: ProductDetail }>(
    `/api/products/${slug}`,
    fetcher,
    { dedupingInterval: 10000, revalidateOnFocus: false }
  );

  // Check if the user has purchased this product (for review eligibility)
  const { data: purchaseData } = useSWR<{ purchased: boolean }>(
    user ? `/api/products/${slug}/ownership` : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false }
  );
  const canReview = !!(user && purchaseData?.purchased);

  const handleSubmitReview = async (review: { rating: number; title: string; content: string }) => {
    try {
      const res = await fetch(`/api/products/${slug}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Review submission failed:", body.error);
        return;
      }
      // Re-fetch product data to show the new review
      window.location.reload();
    } catch (err) {
      console.error("Failed to submit review:", err);
    }
  };

  // Fetch related products (same tier)
  const { data: relatedData } = useSWR<{ products: ProductListItem[] }>(
    data?.product
      ? `/api/products?tier=${data.product.tier}&limit=4`
      : null,
    fetcher,
    { dedupingInterval: 30000, revalidateOnFocus: false }
  );

  const product = data?.product;
  const relatedProducts = (relatedData?.products ?? []).filter(
    (p) => p.slug !== slug
  ).slice(0, 3);

  if (isLoading) {
    return (
      <div className="relative min-h-screen page-enter">
        <Header />
        <main>
          <Section className="pt-20 sm:pt-28">
            <Container>
              <div className="mx-auto max-w-5xl" aria-busy="true" aria-label="Loading product details">
                <Skeleton className="mb-4 h-4 w-48" />
                <Skeleton className="mb-2 h-10 w-3/4" />
                <Skeleton className="mb-6 h-6 w-full" />
                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-80 w-full" />
                  </div>
                </div>
              </div>
            </Container>
          </Section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="relative min-h-screen page-enter">
        <Header />
        <main>
          <Section className="pt-20 sm:pt-28">
            <Container>
              <div className="mx-auto max-w-xl text-center" role="alert">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
                <h1 className="mt-4 text-2xl font-bold text-foreground">Product Not Found</h1>
                <p className="mt-2 text-muted-foreground">
                  The product you are looking for does not exist or has been removed.
                </p>
                <Link href="/products">
                  <GradientButton className="mt-6">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Browse Products
                  </GradientButton>
                </Link>
              </div>
            </Container>
          </Section>
        </main>
        <Footer />
      </div>
    );
  }

  const delivery = deliveryIcons[product.deliveryType] || deliveryIcons.download;
  const DeliveryIcon = delivery.icon;
  const tierConfig = TIER_CONFIG[product.tier];

  // Product structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline,
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
          }
        : undefined,
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden page-enter">
      <Header />

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main>
        {/* Hero */}
        <Section className="relative overflow-hidden pb-8 pt-20 sm:pb-12 sm:pt-28">
          <GradientOrb position="top-left" size="lg" color="primary" />
          <GradientOrb position="top-right" size="md" color="accent" />
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-5xl">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Link href="/products" className="hover:text-foreground transition-colors">
                    Products
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hover:text-foreground transition-colors">
                    {TIER_LABELS[product.tier]}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="text-foreground font-medium truncate" aria-current="page">
                    {product.name}
                  </span>
                </nav>

                {/* Product header */}
                <article>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <TierBadge tier={product.tier} size="md" />
                        <span className="text-xs text-muted-foreground">
                          {CATEGORY_LABELS[product.category]}
                        </span>
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                        {product.name}
                      </h1>
                      <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
                        {product.tagline}
                      </p>

                      {/* Rating & sales */}
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <StarRating rating={product.rating} size="md" showValue />
                          <span className="text-sm text-muted-foreground">
                            ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" aria-hidden="true" />
                          {product.salesCount.toLocaleString()} sold
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Main content: two-column layout */}
        <Section className="pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Left column - main content */}
                <div className="lg:col-span-2 space-y-10">
                  {/* Description (rendered as markdown-like content) */}
                  <FadeInView>
                    <div className="prose prose-sm prose-invert max-w-none">
                      {product.description.split("\n").map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <br key={i} />;
                        if (trimmed.startsWith("## "))
                          return (
                            <h2 key={i} className="mt-8 text-xl font-bold text-foreground first:mt-0">
                              {trimmed.slice(3)}
                            </h2>
                          );
                        if (trimmed.startsWith("### "))
                          return (
                            <h3 key={i} className="mt-6 text-lg font-semibold text-foreground">
                              {trimmed.slice(4)}
                            </h3>
                          );
                        if (trimmed.startsWith("- "))
                          return (
                            <div key={i} className="flex items-start gap-2 ml-1">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                              <span className="text-sm leading-relaxed text-muted-foreground">
                                {trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}
                              </span>
                            </div>
                          );
                        if (trimmed.match(/^\d+\./))
                          return (
                            <div key={i} className="flex items-start gap-2 ml-1">
                              <span className="text-sm font-semibold text-primary shrink-0">
                                {trimmed.split(".")[0]}.
                              </span>
                              <span className="text-sm leading-relaxed text-muted-foreground">
                                {trimmed.slice(trimmed.indexOf(".") + 1).trim().replace(/\*\*(.*?)\*\*/g, "$1")}
                              </span>
                            </div>
                          );
                        return (
                          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                            {trimmed.replace(/\*\*(.*?)\*\*/g, "$1")}
                          </p>
                        );
                      })}
                    </div>
                  </FadeInView>

                  {/* What's Included */}
                  {product.includes && product.includes.length > 0 && (
                    <FadeInView delay={0.1}>
                      <section className="rounded-xl border border-border/60 bg-card p-6" aria-labelledby="includes-heading">
                        <h2 id="includes-heading" className="text-lg font-semibold text-foreground mb-4">
                          What&apos;s Included
                        </h2>
                        <ul className="space-y-3">
                          {product.includes.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </FadeInView>
                  )}

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <FadeInView delay={0.15}>
                      <section className="rounded-xl border border-border/60 bg-card p-6" aria-labelledby="features-heading">
                        <h2 id="features-heading" className="text-lg font-semibold text-foreground mb-4">
                          Features
                        </h2>
                        <ul className="grid gap-3 sm:grid-cols-2">
                          {product.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </FadeInView>
                  )}

                  {/* Tech Stack */}
                  {product.techStack && product.techStack.length > 0 && (
                    <FadeInView delay={0.2}>
                      <section aria-labelledby="techstack-heading">
                        <h2 id="techstack-heading" className="text-lg font-semibold text-foreground mb-4">
                          Tech Stack
                        </h2>
                        <ul className="flex flex-wrap gap-2" aria-label="Technologies used">
                          {product.techStack.map((tech) => (
                            <li
                              key={tech}
                              className="inline-flex items-center rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground"
                            >
                              {tech}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </FadeInView>
                  )}

                  {/* Reviews */}
                  <FadeInView delay={0.25}>
                    <section aria-labelledby="reviews-heading">
                      <h2 id="reviews-heading" className="text-xl font-semibold text-foreground mb-6">
                        Reviews
                      </h2>
                      <ProductReviews
                        reviews={product.reviews || []}
                        averageRating={product.rating}
                        reviewCount={product.reviewCount}
                        canReview={canReview}
                        onSubmitReview={handleSubmitReview}
                      />
                    </section>
                  </FadeInView>
                </div>

                {/* Right column - sticky sidebar */}
                <aside className="lg:col-span-1" aria-label="Purchase options">
                  <div className="sticky top-24 space-y-6">
                    {/* Price card */}
                    <FadeInView direction="right">
                      <div className="rounded-xl border border-border/60 bg-card p-6">
                        <ProductPriceDisplay
                          price={product.price}
                          comparePrice={product.comparePrice}
                          size="lg"
                        />

                        <GradientButton
                          size="lg"
                          className="mt-6 w-full btn-shine text-base"
                          onClick={handleBuyNow}
                          disabled={checkoutLoading}
                          aria-label={checkoutLoading ? "Processing purchase" : `Buy ${product.name} for ${(product.price / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
                        >
                          {checkoutLoading ? (
                            <>
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                              Processing…
                            </>
                          ) : (
                            "Buy Now"
                          )}
                        </GradientButton>
                        {checkoutError && (
                          <p className="mt-2 text-sm text-red-400" role="alert">{checkoutError}</p>
                        )}

                        {/* Delivery type */}
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <DeliveryIcon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                          {delivery.label}
                        </div>

                        {/* Deliverable format */}
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4 text-primary/60 shrink-0" aria-hidden="true" />
                          <span className="text-xs">{delivery.description}</span>
                        </div>

                        {/* Guarantee */}
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Shield className="h-4 w-4 text-accent" aria-hidden="true" />
                          60-Day Money-Back Guarantee
                        </div>

                        {/* Social proof */}
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                          {product.salesCount.toLocaleString()} people bought this
                        </div>
                      </div>
                    </FadeInView>

                    {/* Quick info */}
                    <FadeInView direction="right" delay={0.1}>
                      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                        <h3 className="text-sm font-semibold text-foreground">Product Info</h3>
                        <dl className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Tier</dt>
                            <dd><TierBadge tier={product.tier} size="sm" /></dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Category</dt>
                            <dd className="font-medium text-foreground">
                              {CATEGORY_LABELS[product.category]}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Delivery</dt>
                            <dd className="font-medium text-foreground">{delivery.label}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Last Updated</dt>
                            <dd className="font-medium text-foreground">
                              <time dateTime={product.updatedAt}>
                                {new Date(product.updatedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </time>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </FadeInView>
                  </div>
                </aside>
              </div>
            </div>
          </Container>
        </Section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <Section className="border-t border-border/40">
            <Container>
              <FadeInView>
                <section className="mx-auto max-w-5xl" aria-labelledby="related-heading">
                  <h2 id="related-heading" className="text-2xl font-bold text-foreground mb-8">
                    Related <GradientText>Products</GradientText>
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Related products">
                    {relatedProducts.map((p, i) => (
                      <ProductCard key={p.id} product={p} index={i} />
                    ))}
                  </div>
                </section>
              </FadeInView>
            </Container>
          </Section>
        )}
      </main>

      <Footer />
    </div>
  );
}
