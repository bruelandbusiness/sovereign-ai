import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { MobilePullIndicator } from "@/components/shared/MobilePullIndicator";

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
  return (
    <NuqsAdapter>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Skip to main content
      </a>
      <MobilePullIndicator />
      <DashboardNav />
      <Breadcrumbs />
      <main id="main-content" tabIndex={-1}>{children}</main>
    </NuqsAdapter>
  );
}
