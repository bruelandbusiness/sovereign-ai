import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/signup" },
  title: "Get Started Free | Sovereign AI",
  description:
    "Start your 14-day free trial of Sovereign AI. No credit card required. Get instant access to AI-powered marketing tools built for HVAC, plumbing, roofing, and home service businesses.",
  openGraph: {
    title: "Get Started Free | Sovereign AI",
    description:
      "Start your 14-day free trial of Sovereign AI. No credit card required. AI-powered marketing tools for home service businesses.",
    url: "/signup",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Started Free | Sovereign AI",
    description:
      "Start your 14-day free trial of Sovereign AI. No credit card required.",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
