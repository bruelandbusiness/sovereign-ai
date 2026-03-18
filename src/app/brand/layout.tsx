import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Guidelines",
  description: "Sovereign AI brand guidelines — logo usage, color palette, typography, and tone of voice.",
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
