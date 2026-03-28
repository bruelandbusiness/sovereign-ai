import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  title: "16 AI Marketing Services",
  description:
    "Explore 16 done-for-you AI marketing services: lead generation, SEO, reputation management, ad optimization, and more for home service businesses.",
  openGraph: {
    title: "AI Marketing Services — Sovereign AI",
    description:
      "16 done-for-you AI services: lead generation, SEO, reputation management, ad optimization, and more for home service businesses.",
    url: "/services",
  },
  twitter: {
    card: "summary_large_image",
    title: "16 AI Marketing Services — Sovereign AI",
    description:
      "Done-for-you AI marketing: lead gen, SEO, reviews, ads, content, chatbots, voice agents, and more. All running 24/7.",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
