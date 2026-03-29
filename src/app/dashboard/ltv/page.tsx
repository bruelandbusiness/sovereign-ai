"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import dynamic from "next/dynamic";

const LTVDashboard = dynamic(
  () => import("@/components/dashboard/services/LTVDashboard").then((m) => m.LTVDashboard),
  { ssr: false, loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" /> },
);

export default function LTVPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          <LTVDashboard />
        </Container>
      </main>

      <Footer />
    </div>
  );
}
