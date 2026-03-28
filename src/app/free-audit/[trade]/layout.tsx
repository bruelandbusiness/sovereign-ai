import type { Metadata } from "next";

function formatTrade(trade: string): string {
  return trade
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trade: string }>;
}): Promise<Metadata> {
  const { trade } = await params;
  const tradeName = formatTrade(trade);

  return {
    title: `Free ${tradeName} Marketing Audit | Sovereign AI`,
    description: `Get a free AI-powered marketing audit for your ${tradeName.toLowerCase()} business. Discover missed leads, SEO gaps, and growth opportunities in under 60 seconds.`,
    alternates: { canonical: `/free-audit/${trade}` },
    openGraph: {
      title: `Free ${tradeName} Marketing Audit | Sovereign AI`,
      description: `Get a free AI-powered marketing audit for your ${tradeName.toLowerCase()} business. Discover missed leads, SEO gaps, and growth opportunities.`,
      url: `/free-audit/${trade}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Free ${tradeName} Marketing Audit | Sovereign AI`,
      description: `Get a free AI-powered marketing audit for your ${tradeName.toLowerCase()} business.`,
    },
  };
}

export default function FreeAuditTradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
