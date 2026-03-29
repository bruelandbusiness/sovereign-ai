"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { CHANGELOG, ChangelogEntry } from "@/lib/changelog";

/* ─── Metadata (exported via generateMetadata for client components) ── */

// Since this is a client component for interactivity, metadata is set
// via the head tag or a parallel metadata route. For static metadata in
// a "use client" page, Next.js supports generateMetadata only in server
// components. The title/description below are rendered in the page itself.

const PAGE_TITLE = "What's New | Sovereign AI";
const PAGE_DESCRIPTION =
  "See what's new in Sovereign AI. Product updates, new features, improvements, and bug fixes shipped every week.";

/* ─── Category Configuration ─────────────────────────────────────── */

type Category = ChangelogEntry["category"];

const CATEGORY_CONFIG: Record<Category, { label: string; className: string }> =
  {
    feature: {
      label: "New Feature",
      className: "bg-primary/10 text-primary",
    },
    improvement: {
      label: "Improvement",
      className: "bg-accent/10 text-accent",
    },
    fix: {
      label: "Bug Fix",
      className: "bg-amber-500/10 text-amber-400",
    },
    security: {
      label: "Security",
      className: "bg-emerald-500/10 text-emerald-400",
    },
  };

const FILTER_OPTIONS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All Updates" },
  { value: "feature", label: "Features" },
  { value: "improvement", label: "Improvements" },
  { value: "fix", label: "Fixes" },
  { value: "security", label: "Security" },
];

/* ─── Page Component ─────────────────────────────────────────────── */

export default function ChangelogPage() {
  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");

  const filtered =
    activeFilter === "all"
      ? CHANGELOG
      : CHANGELOG.filter((entry) => entry.category === activeFilter);

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <title>{PAGE_TITLE}</title>
      <meta name="description" content={PAGE_DESCRIPTION} />
      <meta property="og:title" content={PAGE_TITLE} />
      <meta property="og:description" content={PAGE_DESCRIPTION} />
      <meta property="og:url" content="/changelog" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={PAGE_TITLE} />
      <meta name="twitter:description" content={PAGE_DESCRIPTION} />
      <link rel="canonical" href="/changelog" />

      <Header />

      <main id="main-content" className="flex-1">
        <Section>
          <Container size="md">
            {/* ── Header ──────────────────────────────────────── */}
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  <GradientText>What&apos;s New</GradientText>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Product updates, new features, and improvements to Sovereign
                  AI. We ship every week.
                </p>
              </div>
            </FadeInView>

            {/* ── Category Filters ────────────────────────────── */}
            <FadeInView delay={0.05}>
              <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-2">
                {FILTER_OPTIONS.map((option) => {
                  const isActive = activeFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setActiveFilter(option.value)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </FadeInView>

            {/* ── Timeline ────────────────────────────────────── */}
            <div className="mx-auto mt-14 max-w-2xl">
              {filtered.length === 0 && (
                <p className="py-12 text-center text-muted-foreground">
                  No updates in this category yet.
                </p>
              )}

              {filtered.map((entry, i) => {
                const config = CATEGORY_CONFIG[entry.category];
                return (
                  <FadeInView key={entry.version} delay={i * 0.03}>
                    <div className="relative flex gap-6 pb-8">
                      {/* Timeline line */}
                      {i < filtered.length - 1 && (
                        <div className="absolute left-[11px] top-6 h-full w-px bg-border/50" />
                      )}
                      {/* Timeline dot */}
                      <div className="relative mt-1.5 h-[22px] w-[22px] shrink-0">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 bg-background" />
                        <div className="absolute inset-[5px] rounded-full gradient-bg" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <time
                            dateTime={entry.date}
                            className="text-xs text-muted-foreground"
                          >
                            {new Date(entry.date + "T00:00:00").toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </time>
                          <span className="text-xs font-medium text-muted-foreground/60">
                            v{entry.version}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.className}`}
                          >
                            {config.label}
                          </span>
                        </div>

                        <h3 className="mt-1 font-display text-lg font-semibold">
                          {entry.title}
                        </h3>

                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {entry.description}
                        </p>

                        {/* Highlights */}
                        {entry.highlights.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {entry.highlights.map((highlight) => (
                              <li
                                key={highlight}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </FadeInView>
                );
              })}
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
