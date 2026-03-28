"use client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { RecruitingDashboard } from "@/components/dashboard/RecruitingDashboard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function RecruitingPage() {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-background page-enter">
        <Header variant="minimal" />
        <main className="flex-1 py-8">
          <Container><RecruitingDashboard /></Container>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
