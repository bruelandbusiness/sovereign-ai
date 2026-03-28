import type { Metadata } from "next";
import { AffiliateDashboard } from "@/components/affiliates/AffiliateDashboard";

export const metadata: Metadata = {
  title: "Affiliate Dashboard",
  description:
    "Track your referrals, commissions, and payouts as a Sovereign AI affiliate partner.",
  robots: { index: false, follow: false },
};

export default function AffiliatesPage() {
  return <AffiliateDashboard />;
}
