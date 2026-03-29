import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description:
    "You are currently offline. Please check your internet connection to continue using Sovereign AI.",
  robots: { index: false, follow: false },
};

export default function OfflineLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
