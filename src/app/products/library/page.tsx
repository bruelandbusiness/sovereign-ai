"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowRight,
  Download,
  ExternalLink,
  Key,
  Loader2,
  Package,
  ShoppingBag,
  Star,
} from "lucide-react";
import { useSession } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientOrb } from "@/components/layout/GradientOrb";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { GradientButton } from "@/components/shared/GradientButton";
import { TierBadge } from "@/components/products/TierBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-context";
import type { ProductPurchase, ProductTier, DeliveryType } from "@/types/products";
import { fetcher } from "@/lib/fetcher";

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const deliveryActions: Record<string, { icon: typeof Download; label: string }> = {
  download: { icon: Download, label: "Download" },
  access: { icon: Download, label: "Download" },
  api_key: { icon: Download, label: "Download" },
  github: { icon: Download, label: "Download" },
};

export default function ProductLibraryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading: authLoading } = useSession();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const { data, isLoading, error, mutate } = useSWR<{ purchases: ProductPurchase[] }>(
    user ? "/api/products/library" : null,
    fetcher
  );

  const purchases = data?.purchases ?? [];

  const handleDownload = useCallback(async (purchaseId: string) => {
    setDownloadingId(purchaseId);
    try {
      const res = await fetch(`/api/products/library/${purchaseId}/download`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Download failed");
      }

      // Check if the response is a file download (has Content-Disposition)
      const contentDisposition = res.headers.get("Content-Disposition");

      if (contentDisposition && contentDisposition.includes("attachment")) {
        // It's a file download — save it
        const blob = await res.blob();
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        const filename = filenameMatch ? filenameMatch[1] : "deliverable.md";

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Legacy JSON response — open the delivery URL if available
        const body = await res.json();
        if (body.deliveryUrl && isSafeUrl(body.deliveryUrl)) {
          window.open(body.deliveryUrl, "_blank");
        }
      }

      // Refresh purchase data to update download count
      mutate();
    } catch (err) {
      console.error("Download failed:", err);
      toast(err instanceof Error ? err.message : "We couldn't start the download. Please try again.", "error");
    } finally {
      setDownloadingId(null);
    }
  }, [mutate, toast]);

  if (authLoading) {
    return (
      <div className="relative min-h-screen page-enter">
        <Header />
        <main>
          <Section className="pt-20 sm:pt-28">
            <Container>
              <div className="mx-auto max-w-4xl" aria-busy="true" aria-label="Loading your library">
                <Skeleton className="mb-8 h-10 w-48" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-card p-6">
                      <Skeleton className="mb-3 h-5 w-20" />
                      <Skeleton className="mb-2 h-6 w-3/4" />
                      <Skeleton className="mb-4 h-4 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </Container>
          </Section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden page-enter">
      <Header />

      <main>
        {/* Hero */}
        <Section className="relative overflow-hidden pb-8 pt-20 sm:pb-12 sm:pt-28">
          <GradientOrb position="top-left" size="lg" color="primary" />
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-4xl">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Your <GradientText>Product Library</GradientText>
                </h1>
                <p className="mt-3 text-lg text-muted-foreground">
                  Access and manage your purchased digital products.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        <Section className="pt-0">
          <Container>
            <div className="mx-auto max-w-4xl">
              {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading purchased products">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-card p-6">
                      <Skeleton className="mb-3 h-5 w-20" />
                      <Skeleton className="mb-2 h-6 w-3/4" />
                      <Skeleton className="mb-4 h-4 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-xl border border-dashed border-destructive/40 p-12 text-center" role="alert">
                  <p className="text-sm text-destructive">
                    Failed to load your library. Please try again later.
                  </p>
                </div>
              ) : purchases.length === 0 ? (
                /* Empty state */
                <FadeInView>
                  <div className="rounded-xl border border-dashed border-border/60 p-12 text-center" role="status">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
                    <h2 className="mt-4 text-xl font-semibold text-foreground">
                      Your library is empty
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                      You haven&apos;t purchased any digital products yet. Browse our
                      collection of AI tools, agents, and templates.
                    </p>
                    <Link href="/products">
                      <GradientButton className="mt-6">
                        Browse Products
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </GradientButton>
                    </Link>
                  </div>
                </FadeInView>
              ) : (
                /* Product grid */
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Purchased products">
                  {purchases.map((purchase, index) => {
                    const { product } = purchase;
                    const action = deliveryActions[product.deliveryType as DeliveryType] || deliveryActions.download;
                    const ActionIcon = action.icon;
                    const isDownloading = downloadingId === purchase.id;

                    return (
                      <FadeInView key={purchase.id} delay={index * 0.05}>
                        <article
                          className="group flex h-full flex-col rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30"
                          role="listitem"
                        >
                          {/* Tier badge */}
                          <div className="mb-3 flex items-center justify-between">
                            <TierBadge tier={product.tier as ProductTier} size="sm" />
                            <time
                              dateTime={purchase.createdAt}
                              className="text-[11px] text-muted-foreground/60"
                            >
                              {new Date(purchase.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </time>
                          </div>

                          {/* Product info */}
                          <h3 className="text-base font-semibold text-foreground">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 flex-1">
                            {product.tagline}
                          </p>

                          {/* Download count */}
                          {purchase.downloadCount > 0 && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Download className="h-3 w-3" aria-hidden="true" />
                              Downloaded {purchase.downloadCount} time{purchase.downloadCount !== 1 ? "s" : ""}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-4 flex gap-2 border-t border-border/40 pt-4">
                            <GradientButton
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDownload(purchase.id)}
                              disabled={isDownloading}
                              aria-label={isDownloading ? `Downloading ${product.name}` : `Download ${product.name}`}
                            >
                              {isDownloading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                <ActionIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                              {isDownloading ? "Downloading..." : action.label}
                            </GradientButton>
                            <Link href={`/products/${product.slug}`} aria-label={`Review ${product.name}`}>
                              <GradientButton variant="outline" size="sm">
                                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                                Review
                              </GradientButton>
                            </Link>
                          </div>
                        </article>
                      </FadeInView>
                    );
                  })}
                </div>
              )}
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
