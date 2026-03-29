import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients — Admin",
  description: "Manage client accounts and subscriptions.",
  openGraph: {
    title: "Clients — Admin — Sovereign AI",
    description: "Manage client accounts and subscriptions.",
  },
  robots: { index: false, follow: false },
};

export default function AdminClientsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
