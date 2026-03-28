import type { Metadata } from "next";
import { VSLPage } from "@/components/funnel/VSLPage";

export const metadata: Metadata = {
  title: "See How AI Books Jobs While You Sleep",
  description:
    "Watch how Sovereign AI's chatbot, review automation, and lead gen systems work in real-time for home service businesses.",
  openGraph: {
    title: "See How AI Books Jobs While You Sleep | Sovereign AI",
    description:
      "10-minute demo showing how HVAC, plumbing, and roofing businesses use AI to capture leads and book appointments 24/7.",
  },
};

export default function VSLDemoPage() {
  return <VSLPage />;
}
