"use client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { FranchiseDashboard } from "@/components/dashboard/FranchiseDashboard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function FranchisePage() {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background page-enter">
        <Header variant="minimal" />
        <main className="flex-1 py-8">
          <Container><FranchiseDashboard /></Container>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
