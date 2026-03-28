import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/products" },
  title: "Digital Products | Sovereign AI",
  description:
    "Enterprise-grade AI tools, agents, and templates for businesses. Browse Sovereign AI's digital product catalog and SaaS tools.",
  openGraph: {
    title: "Digital Products | Sovereign AI",
    description:
      "Enterprise-grade AI tools, agents, and templates. Browse Sovereign AI's digital product catalog for home service businesses.",
    url: "/products",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Products | Sovereign AI",
    description:
      "Enterprise-grade AI tools, agents, and templates built for businesses that want to lead.",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
