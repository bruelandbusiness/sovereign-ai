import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FindAProClient } from "@/components/marketplace/FindAProClient";

export const metadata: Metadata = {
  alternates: { canonical: "/find-a-pro" },
  title: "Find a Pro Near You | Sovereign AI",
  description:
    "Connect with top-rated, AI-powered home service pros in your area. Get free quotes from verified professionals.",
  openGraph: {
    title: "Find a Pro Near You | Sovereign AI",
    description:
      "Connect with top-rated, AI-powered home service professionals in your area.",
    url: "/find-a-pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find a Pro Near You | Sovereign AI",
    description:
      "Connect with top-rated, AI-powered home service professionals in your area.",
  },
};

export default function FindAProPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main id="main-content" className="flex-1">
        <FindAProClient />
      </main>

      <Footer />
    </div>
  );
}
