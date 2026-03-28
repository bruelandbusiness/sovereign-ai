import type { Metadata } from "next";
import { AffiliateSignup } from "@/components/affiliates/AffiliateSignup";

export const metadata: Metadata = {
  alternates: { canonical: "/affiliates/signup" },
  title: "Affiliate Program -- Earn Up to 35% Recurring Commissions",
  description:
    "Join the Sovereign AI affiliate program and earn up to 35% recurring lifetime commissions by referring home service businesses. Free to join, monthly Stripe payouts, real-time tracking dashboard.",
  keywords: [
    "affiliate program",
    "recurring commissions",
    "home service marketing",
    "referral program",
    "passive income",
    "Sovereign AI affiliate",
  ],
  openGraph: {
    title:
      "Earn Up to 35% Recurring Commissions -- Sovereign AI Affiliate Program",
    description:
      "Refer home service businesses to Sovereign AI and earn up to 35% of every monthly payment, for life. Free to join with tiered commission rates.",
    type: "website",
    url: "/affiliates/signup",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sovereign AI Affiliate Program -- Up to 35% Recurring",
    description:
      "Earn up to 35% lifetime recurring commissions by referring home service businesses to Sovereign AI.",
  },
};

export default function AffiliateSignupPage() {
  return <AffiliateSignup />;
}
