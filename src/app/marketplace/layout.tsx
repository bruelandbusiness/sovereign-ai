import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Services Marketplace",
  description:
    "Browse 16 AI-powered marketing services for local businesses. From AI phone agents to automated SEO — each service runs 24/7 to generate leads and grow revenue.",
  openGraph: {
    title: "AI Services Marketplace — Sovereign AI",
    description:
      "16 done-for-you AI marketing services starting at $497/mo. Lead generation, reputation management, content creation, and more.",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
