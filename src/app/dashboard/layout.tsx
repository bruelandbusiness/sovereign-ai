import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Dashboard",
  description:
    "Track your leads, ROI, and AI marketing performance in real time. Your Sovereign AI client dashboard.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
