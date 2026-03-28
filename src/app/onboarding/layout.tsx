import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Onboarding",
  description:
    "Get started with Sovereign AI in under 5 minutes. Tell us about your business and we'll have your AI marketing live within 48 hours.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
