import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/login" },
  title: "Sign In | Sovereign AI",
  description:
    "Sign in to your Sovereign AI client dashboard. Access your AI marketing tools, leads, analytics, and campaign management — all in one place.",
  openGraph: {
    title: "Sign In | Sovereign AI",
    description:
      "Sign in to your Sovereign AI client dashboard. Access your AI marketing tools, leads, and analytics.",
    url: "/login",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | Sovereign AI",
    description:
      "Sign in to your Sovereign AI client dashboard. Access your AI marketing tools and analytics.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
