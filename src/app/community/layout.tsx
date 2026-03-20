import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/community" },
  title: "Community | Sovereign AI",
  description:
    "Join the Sovereign AI community of home service business owners. Share tips, celebrate wins, ask questions, and connect with fellow HVAC, plumbing, roofing, and electrical professionals using AI marketing.",
  openGraph: {
    title: "Community | Sovereign AI",
    description:
      "Join the Sovereign AI community. Share tips, celebrate wins, and connect with fellow home service business owners using AI marketing.",
    url: "/community",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community | Sovereign AI",
    description:
      "Join the Sovereign AI community. Share tips, celebrate wins, and connect with fellow business owners.",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
