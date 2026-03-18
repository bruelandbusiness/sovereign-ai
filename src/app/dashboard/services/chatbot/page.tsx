"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ChatbotDashboard } from "@/components/dashboard/services/ChatbotDashboard";

export default function ChatbotPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <ChatbotDashboard />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
