import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agency Dashboard",
  description:
    "Manage your agency clients, track MRR, and monitor service performance.",
  openGraph: {
    title: "Agency Dashboard — Sovereign AI",
    description:
      "Manage your agency clients, track MRR, and monitor service performance.",
    url: "/agency",
  },
  robots: { index: false, follow: false },
};

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
