import type { Metadata } from "next";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Sovereign AI admin panel. Manage clients, agencies, products, and platform operations.",
  openGraph: {
    title: "Admin — Sovereign AI",
    description:
      "Sovereign AI admin panel for managing clients, agencies, and platform operations.",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
