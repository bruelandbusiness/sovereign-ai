import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quote",
  description:
    "View and approve your Sovereign AI service quote. See pricing, line items, and get started with AI-powered marketing.",
  openGraph: {
    title: "Your Quote — Sovereign AI",
    description:
      "View and approve your Sovereign AI service quote with detailed pricing and line items.",
    url: "/quotes",
  },
  robots: { index: false, follow: false },
};

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
