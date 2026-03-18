"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ContentDashboard } from "@/components/dashboard/services/ContentDashboard";

export default function ContentPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <ContentDashboard />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
