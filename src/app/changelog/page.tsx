import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";
import { CHANGELOG } from "@/lib/changelog";

export const metadata: Metadata = {
  alternates: { canonical: "/changelog" },
  title: "What's New | Sovereign AI",
  description:
    "See what's new in Sovereign AI. Product updates, new features, improvements, and bug fixes.",
  openGraph: {
    title: "What's New | Sovereign AI",
    description:
      "See what's new in Sovereign AI. Product updates, new features, improvements, and bug fixes.",
    url: "/changelog",
  },
};

const CATEGORY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
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
  launch: {
    label: "Launch",
    className: "bg-purple-500/10 text-purple-400",
  },
};

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Changelog", url: "/changelog" },
        ]}
      />
      <Header />

      <main id="main-content" className="flex-1">
        <Section>
          <Container size="md">
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

            <div className="mx-auto mt-14 max-w-2xl">
              {CHANGELOG.map((entry, i) => {
                const config =
                  CATEGORY_CONFIG[entry.category] ?? CATEGORY_CONFIG.feature;
                return (
                  <FadeInView key={entry.version} delay={i * 0.03}>
                    <div className="relative flex gap-6 pb-8">
                      {/* Timeline line */}
                      {i < CHANGELOG.length - 1 && (
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
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
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
