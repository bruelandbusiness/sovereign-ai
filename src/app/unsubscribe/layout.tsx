import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description:
    "Manage your Sovereign AI email preferences and unsubscribe from marketing communications.",
  openGraph: {
    title: "Unsubscribe — Sovereign AI",
    description:
      "Manage your email preferences and unsubscribe from Sovereign AI communications.",
    url: "/unsubscribe",
  },
  robots: { index: false, follow: false },
};

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
