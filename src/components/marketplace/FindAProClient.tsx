"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Search, MapPin, Shield, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProCard, type ProResult } from "./ProCard";
import { RequestQuoteModal } from "./RequestQuoteModal";
import { VERTICALS } from "@/lib/constants";

interface SearchResponse {
  data: ProResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

function buildSearchUrl(
  zip: string,
  vertical: string,
  page: number
): string | null {
  if (!zip || zip.length < 5) return null;
  const params = new URLSearchParams({ zip, page: String(page), limit: "12" });
  if (vertical && vertical !== "all") {
    params.set("vertical", vertical);
  }
  return `/api/find-a-pro?${params.toString()}`;
}

function ProCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mb-2 h-5 w-24 rounded-full" />
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mb-5 space-y-1.5">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

export function FindAProClient() {
  const [zipInput, setZipInput] = useState("");
  const [verticalInput, setVerticalInput] = useState("all");
  const [searchZip, setSearchZip] = useState("");
  const [searchVertical, setSearchVertical] = useState("all");
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Quote modal state
  const [selectedPro, setSelectedPro] = useState<ProResult | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const searchUrl = buildSearchUrl(searchZip, searchVertical, page);

  const { data, isLoading, error } = useSWR<SearchResponse>(
    searchUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 10000, // avoid duplicate search requests for 10 seconds
    }
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (zipInput.length < 5) return;
      setSearchZip(zipInput.trim());
      setSearchVertical(verticalInput);
      setPage(1);
      setHasSearched(true);
    },
    [zipInput, verticalInput]
  );

  const handleRequestQuote = useCallback((pro: ProResult) => {
    setSelectedPro(pro);
    setQuoteModalOpen(true);
  }, []);

  const results = data?.data || [];
  const pagination = data?.pagination;
  const showResults = hasSearched;

  return (
    <>
      {/* Hero Section */}
      <Section className="pb-8 sm:pb-10 lg:pb-12">
        <Container size="md">
          <FadeInView>
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Find a Trusted Pro{" "}
                <GradientText>Near You</GradientText>
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">
                Connect with top-rated, AI-powered home service professionals in
                your area. Every pro uses Sovereign AI to deliver faster
                responses, better service, and smarter results.
              </p>
            </div>
          </FadeInView>
        </Container>
      </Section>

      {/* Search Bar */}
      <Section className="bg-muted/30 py-8 sm:py-10">
        <Container size="md">
          <FadeInView delay={0.1}>
            <form
              onSubmit={handleSearch}
              aria-label="Search for professionals"
              className="mx-auto flex max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-1.5">
                <label
                  htmlFor="zip-input"
                  className="text-xs font-medium text-muted-foreground"
                >
                  ZIP Code
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="zip-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    placeholder="Enter your ZIP code"
                    value={zipInput}
                    onChange={(e) =>
                      setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                    className="h-10 pl-9"
                    required
                  />
                </div>
              </div>

              <div className="w-full space-y-1.5 sm:w-48">
                <label
                  htmlFor="vertical-select"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Service Type
                </label>
                <select
                  id="vertical-select"
                  value={verticalInput}
                  onChange={(e) => setVerticalInput(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="all">All Services</option>
                  {VERTICALS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                disabled={zipInput.length < 5}
                className="h-10 gap-2 gradient-bg text-white hover:opacity-90 sm:w-auto"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </FadeInView>
        </Container>
      </Section>

      {/* Results */}
      {showResults && (
        <Section>
          <Container>
            {/* Loading State */}
            {isLoading && !data && (
              <div role="status" aria-live="polite">
                <div className="mb-6 text-sm text-muted-foreground">
                  Searching for pros near {searchZip}...
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <FadeInView>
                <div role="alert" className="mx-auto max-w-md rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                  <p className="text-sm text-destructive">
                    Something went wrong while searching. Please try again.
                  </p>
                  <Button
                    onClick={() => {
                      setSearchZip("");
                      setHasSearched(false);
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </FadeInView>
            )}

            {/* Empty State */}
            {!isLoading && !error && results.length === 0 && (
              <FadeInView>
                <div className="mx-auto max-w-md rounded-xl border border-border/50 bg-card p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <MapPin className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">
                    No Pros in This Area Yet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We don&apos;t have any AI-powered pros in{" "}
                    <span className="font-medium text-foreground">
                      {searchZip}
                    </span>{" "}
                    yet
                    {searchVertical !== "all" && " for this service type"}.
                    Try a different ZIP code or service type.
                  </p>
                  <Button
                    onClick={() => {
                      setZipInput("");
                      setSearchZip("");
                      setHasSearched(false);
                    }}
                    variant="outline"
                    className="mt-5"
                  >
                    Clear Search
                  </Button>
                </div>
              </FadeInView>
            )}

            {/* Results Grid */}
            {!error && results.length > 0 && (
              <div>
                <FadeInView>
                  <div className="mb-6 flex items-center justify-between">
                    <p aria-live="polite" className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {pagination?.total || results.length}
                      </span>{" "}
                      pro{(pagination?.total || results.length) !== 1 && "s"}{" "}
                      found near{" "}
                      <span className="font-medium text-foreground">
                        {searchZip}
                      </span>
                    </p>
                  </div>
                </FadeInView>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((pro, i) => (
                    <FadeInView key={pro.clientId} delay={i * 0.05}>
                      <ProCard
                        pro={pro}
                        onRequestQuote={handleRequestQuote}
                      />
                    </FadeInView>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Container>
        </Section>
      )}

      {/* Trust Badges (shown when no search yet) */}
      {!showResults && (
        <Section>
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
                Why Choose an{" "}
                <GradientText>AI-Powered</GradientText> Pro?
              </h2>
            </FadeInView>
            <div className="mx-auto mt-10 grid max-w-4xl gap-8 sm:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: "Faster Response Times",
                  description:
                    "AI-powered pros use automated scheduling and instant communication to respond to your inquiry in minutes, not days.",
                },
                {
                  icon: Shield,
                  title: "Verified & Trusted",
                  description:
                    "Every pro on our marketplace is a verified Sovereign AI client with real reviews, real ratings, and real results.",
                },
                {
                  icon: Search,
                  title: "Transparent Pricing",
                  description:
                    "Get free quotes with no obligation. Compare pros in your area and choose the best fit for your project.",
                },
              ].map((item, i) => (
                <FadeInView key={item.title} delay={i * 0.1}>
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Quote Modal */}
      <RequestQuoteModal
        pro={selectedPro}
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
      />
    </>
  );
}
