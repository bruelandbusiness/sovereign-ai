import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/estimate" },
  title: "AI-Powered Estimates | Sovereign AI",
  description:
    "Get instant AI-generated repair estimates from a photo. Snap a picture of your issue and receive a ballpark price in seconds — free.",
  openGraph: {
    title: "AI-Powered Estimates | Sovereign AI",
    description:
      "Snap a photo of your home repair issue and get an instant AI-generated estimate. Fast, free, and no obligation.",
    url: "/estimate",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered Estimates | Sovereign AI",
    description:
      "Snap a photo of your home repair issue and get an instant AI-generated estimate.",
  },
};

export default function EstimateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
