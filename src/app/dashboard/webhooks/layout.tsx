import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhooks",
  description:
    "Configure webhook endpoints for real-time event notifications.",
  openGraph: {
    title: "Webhooks — Sovereign AI",
    description:
      "Configure webhook endpoints for real-time event notifications.",
  },
  robots: { index: false, follow: false },
};

export default function WebhooksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
