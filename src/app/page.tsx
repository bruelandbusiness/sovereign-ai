import type { Metadata } from "next";
import { HomePageContent } from "@/components/home/HomePageContent";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: {
    absolute: "Sovereign AI — AI-Powered Marketing for Home Service Businesses",
  },
  description:
    "Done-for-you AI marketing for HVAC, plumbing, roofing, and home service businesses. 16 AI services generating leads, booking appointments, and growing revenue 24/7.",
  openGraph: {
    title: "Sovereign AI — AI-Powered Marketing for Home Service Businesses",
    description:
      "Done-for-you AI marketing for HVAC, plumbing, roofing, and home service businesses. 16 AI services generating leads 24/7.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sovereign AI — AI Marketing for Home Service Businesses",
    description:
      "16 AI services generating leads, booking appointments, and growing revenue 24/7 for HVAC, plumbing, and roofing businesses.",
  },
};

export default function HomePage() {
  return <HomePageContent />;
}
