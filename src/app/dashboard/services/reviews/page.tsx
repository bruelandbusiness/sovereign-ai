import type { Metadata } from "next";
import { ReviewDashboard } from "@/components/dashboard/services/ReviewDashboard";

export const metadata: Metadata = {
  title: "Review Automation | Sovereign AI",
  description: "Manage review campaigns and track customer ratings.",
  robots: { index: false, follow: false },
};

export default function ReviewsPage() {
  return <ReviewDashboard />;
}
