import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Submit support tickets and get help with your Sovereign AI services.",
  robots: { index: false, follow: false },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
