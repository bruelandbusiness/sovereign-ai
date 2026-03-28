import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/demo" },
  title: "Book a Demo | Sovereign AI",
  description:
    "Schedule a live demo of Sovereign AI. See how AI-powered lead generation, follow-ups, and scheduling work for home service businesses.",
  openGraph: {
    title: "Book a Demo | Sovereign AI",
    description:
      "Schedule a live demo and see how AI-powered marketing automation generates leads and books appointments for home service businesses.",
    url: "/demo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a Demo | Sovereign AI",
    description:
      "See how AI-powered marketing automation generates leads and books appointments for home service businesses.",
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
