import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Marketing Audit",
  description:
    "Get a free AI-powered marketing audit for your home service business. We analyze your online presence, SEO, reviews, and competitor landscape in 60 seconds.",
  openGraph: {
    title: "Free AI Marketing Audit — Sovereign AI",
    description:
      "Discover hidden revenue leaks in your marketing. Free 60-second audit for HVAC, plumbing, roofing, and home service businesses.",
  },
};

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
