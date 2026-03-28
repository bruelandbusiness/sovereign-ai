import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description: "Manage your active AI marketing services and view performance.",
  robots: { index: false, follow: false },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
