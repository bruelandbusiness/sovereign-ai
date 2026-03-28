import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/playbook" },
  title: "The AI Marketing Playbook for Home Service Businesses | Sovereign AI",
  description:
    "Free 32-page guide: how to use AI to generate leads, dominate local search, and grow revenue. Real case studies, action steps included.",
  openGraph: {
    title: "Free Download: The AI Marketing Playbook",
    description:
      "32-page guide with real case studies and action steps. How one plumber turned $347 in ad spend into $41,000 in revenue.",
    url: "/playbook",
  },
  twitter: {
    card: "summary_large_image",
    title: "The AI Marketing Playbook | Sovereign AI",
    description:
      "Free 32-page guide: how to use AI to generate leads, dominate local search, and grow revenue.",
  },
};

export default function PlaybookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
