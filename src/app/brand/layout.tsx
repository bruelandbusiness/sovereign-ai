import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/brand" },
  title: "Brand Guidelines",
  description:
    "Sovereign AI brand guidelines — logo usage, color palette, typography, and tone of voice.",
  openGraph: {
    title: "Brand Guidelines — Sovereign AI",
    description:
      "Sovereign AI brand guidelines — logo usage, color palette, typography, and tone of voice.",
    url: "/brand",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Guidelines — Sovereign AI",
    description:
      "Sovereign AI brand guidelines — logo usage, color palette, typography, and tone of voice.",
  },
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
