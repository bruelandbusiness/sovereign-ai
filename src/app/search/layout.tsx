import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search the Sovereign AI knowledge base, blog, help articles, and documentation to find exactly what you need.",
  openGraph: {
    title: "Search — Sovereign AI",
    description:
      "Search the Sovereign AI knowledge base, blog, help articles, and documentation.",
    url: "/search",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
