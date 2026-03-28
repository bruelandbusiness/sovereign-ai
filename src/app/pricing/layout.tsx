import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: "Pricing — AI Marketing Plans",
  description:
    "Transparent, no-contract pricing for AI marketing. Starter at $3,497/mo, Growth at $6,997/mo, Empire at $12,997/mo. 60-day money-back guarantee included.",
  openGraph: {
    title: "Pricing — Sovereign AI Marketing Plans",
    description:
      "Transparent, no-contract pricing for AI-powered marketing. See plans for HVAC, plumbing, roofing, and home service businesses.",
    url: "/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Sovereign AI Marketing Plans",
    description:
      "No contracts, transparent pricing. AI marketing plans starting at $3,497/mo with a 60-day money-back guarantee.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
