"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { AEODashboard } from "@/components/dashboard/services/AEODashboard";

export default function AEOPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          <AEODashboard />
        </Container>
      </main>

      <Footer />
    </div>
  );
}
