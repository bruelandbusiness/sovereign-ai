import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Shield, Cookie } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Legal | Sovereign AI",
  description:
    "Sovereign AI legal documents including our Privacy Policy, Terms of Service, and Cookie Policy.",
  alternates: { canonical: "/legal" },
  openGraph: {
    title: "Legal | Sovereign AI",
    description:
      "Sovereign AI legal documents including our Privacy Policy, Terms of Service, and Cookie Policy.",
    url: "/legal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal | Sovereign AI",
    description:
      "Sovereign AI legal documents including our Privacy Policy, Terms of Service, and Cookie Policy.",
  },
};

const legalPages = [
  {
    href: "/legal/privacy",
    title: "Privacy Policy",
    description: "How we collect, use, and protect your data.",
    icon: Shield,
    updated: "March 28, 2026",
  },
  {
    href: "/legal/terms",
    title: "Terms of Service",
    description: "The agreement governing use of our platform.",
    icon: FileText,
    updated: "March 28, 2026",
  },
  {
    href: "/legal/cookies",
    title: "Cookie Policy",
    description:
      "How we use cookies and similar tracking technologies.",
    icon: Cookie,
    updated: "March 28, 2026",
  },
];

export default function LegalIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 py-16">
        <Container>
          <nav className="mx-auto max-w-2xl" aria-label="Legal documents">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Legal
            </h1>
            <p className="mt-2 text-muted-foreground">
              Review our legal documents and policies.
            </p>

            <ul className="mt-10 space-y-4 list-none p-0">
              {legalPages.map((page) => {
                const Icon = page.icon;
                return (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-primary/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon
                          className="h-5 w-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-semibold">{page.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {page.description}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground/60">
                          Last updated: {page.updated}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
