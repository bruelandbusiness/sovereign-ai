import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/marketplace" },
  title: "AI Services Marketplace",
  description:
    "Browse 16 AI-powered marketing services for local businesses. AI phone agents, automated SEO, and more — running 24/7.",
  openGraph: {
    title: "AI Services Marketplace — Sovereign AI",
    description:
      "16 done-for-you AI marketing services starting at $497/mo. Lead generation, reputation management, content creation, and more.",
    url: "/marketplace",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Services Marketplace — Sovereign AI",
    description:
      "16 done-for-you AI marketing services for local businesses. Lead gen, SEO, reviews, ads, and more.",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
