import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Onboarding",
  description:
    "Get started with Sovereign AI in under 5 minutes. Tell us about your business and we'll have your AI marketing live within 48 hours.",
  openGraph: {
    title: "Client Onboarding — Sovereign AI",
    description:
      "Get started with Sovereign AI in under 5 minutes. Tell us about your business and we'll have your AI marketing live within 48 hours.",
    url: "/onboarding",
  },
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
