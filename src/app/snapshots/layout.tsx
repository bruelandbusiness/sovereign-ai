import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Snapshot",
  description:
    "See your personalized business marketing snapshot powered by Sovereign AI. Review your online presence, SEO health, and growth opportunities.",
  openGraph: {
    title: "Your Business Snapshot — Sovereign AI",
    description:
      "Review your online presence, SEO health, and growth opportunities with a personalized AI-powered marketing snapshot.",
    url: "/snapshots",
  },
  robots: { index: false, follow: false },
};

export default function SnapshotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
