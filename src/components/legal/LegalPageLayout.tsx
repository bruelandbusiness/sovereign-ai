"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, ChevronUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

export interface LegalSection {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly content: React.ReactNode;
}

interface LegalPageLayoutProps {
  readonly title: string;
  readonly lastUpdated: string;
  readonly sections: readonly LegalSection[];
}

export function LegalPageLayout({
  title,
  lastUpdated,
  sections,
}: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    const sectionElements = document.querySelectorAll("[data-legal-section]");
    sectionElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 py-12 md:py-16">
        <Container>
          {/* Breadcrumb + Print */}
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <Link
                href="/legal"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                All Legal Documents
              </Link>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground print:hidden"
                aria-label="Print this page"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Print
              </button>
            </div>

            {/* Title block */}
            <header className="mb-10 border-b border-border pb-8">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </header>

            {/* Two-column layout: TOC sidebar + content */}
            <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
              {/* Table of Contents - sticky sidebar on desktop */}
              <aside className="hidden lg:block print:hidden">
                <nav
                  className="sticky top-24"
                  aria-label="Table of contents"
                >
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    On This Page
                  </h2>
                  <ul className="space-y-1 text-sm">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className={cn(
                            "block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground",
                            activeSection === section.id &&
                              "bg-muted font-medium text-foreground",
                          )}
                        >
                          {section.number}. {section.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>

              {/* Mobile TOC - collapsible at top */}
              <details className="mb-8 rounded-lg border border-border bg-card p-4 lg:hidden print:hidden">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Table of Contents
                </summary>
                <nav className="mt-3" aria-label="Table of contents">
                  <ul className="space-y-1 text-sm">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {section.number}. {section.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>

              {/* Legal content */}
              <article className="space-y-10 text-sm leading-relaxed text-muted-foreground">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    data-legal-section
                    className="scroll-mt-24"
                  >
                    <h2 className="mb-4 text-lg font-semibold text-foreground">
                      {section.number}. {section.title}
                    </h2>
                    <div className="space-y-3">{section.content}</div>
                  </section>
                ))}
              </article>
            </div>
          </div>
        </Container>
      </main>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-all hover:bg-muted print:hidden"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

      <Footer />
    </div>
  );
}
