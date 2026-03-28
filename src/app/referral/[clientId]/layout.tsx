import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Program | Sovereign AI",
  description:
    "Earn rewards by referring fellow contractors to Sovereign AI. Share your unique referral link and get credited when they sign up for AI-powered marketing.",
  alternates: { canonical: "/referral" },
  openGraph: {
    title: "Referral Program | Sovereign AI",
    description:
      "Earn rewards by referring fellow contractors to Sovereign AI. Share your link and get credited when they sign up.",
    url: "/referral",
  },
  twitter: {
    card: "summary_large_image",
    title: "Referral Program | Sovereign AI",
    description:
      "Earn rewards by referring fellow contractors to Sovereign AI.",
  },
};

export default function ReferralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
