import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { StatusPageContent } from "@/components/status/StatusPageContent";

export const metadata: Metadata = {
  alternates: { canonical: "/status" },
  title: "System Status",
  description:
    "Check the real-time operational status of all Sovereign AI services including website, dashboard, API, AI chatbot, email, payments, CRM, and booking.",
  openGraph: {
    title: "System Status | Sovereign AI",
    description:
      "Real-time operational status of all Sovereign AI services.",
    url: "/status",
  },
  twitter: {
    card: "summary",
    title: "System Status | Sovereign AI",
    description:
      "Check the real-time operational status of all Sovereign AI services.",
  },
};

export default function StatusPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[var(--bg-primary)]">
        <Container className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              System Status
            </h1>
            <p className="mt-3 text-muted-foreground">
              Real-time operational status of all Sovereign AI services.
            </p>

            <StatusPageContent />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
