import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/knowledge" },
  title: "Knowledge Base | Sovereign AI",
  description:
    "Find answers, guides, and resources to get the most out of Sovereign AI. Onboarding tutorials, feature guides, and more.",
  openGraph: {
    title: "Knowledge Base | Sovereign AI",
    description:
      "Find answers, guides, and resources to get the most out of Sovereign AI. Browse our help center for tutorials and support.",
    url: "/knowledge",
  },
  twitter: {
    card: "summary_large_image",
    title: "Knowledge Base | Sovereign AI",
    description:
      "Find answers, guides, and resources to get the most out of Sovereign AI.",
  },
};

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
