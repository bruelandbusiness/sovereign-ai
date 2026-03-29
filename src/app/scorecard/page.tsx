import type { Metadata } from "next";
import { ScorecardTool } from "@/components/audit/ScorecardTool";

export const metadata: Metadata = {
  alternates: { canonical: "/scorecard" },
  title: "Free Business Health Score | Sovereign AI",
  description:
    "Get your free business health score in 60 seconds. We analyze your Google presence, website, and competition to show you exactly where you stand.",
  openGraph: {
    title: "Free Business Health Score | Sovereign AI",
    description:
      "Get your instant business health score. See how you stack up against local competitors.",
    url: "/scorecard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Business Health Score | Sovereign AI",
    description:
      "Get your instant business health score. See how you stack up against local competitors.",
  },
};

export default function ScorecardPage() {
  return <ScorecardTool />;
}
