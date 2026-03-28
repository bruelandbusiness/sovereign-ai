import type { Metadata } from "next";
import { FreeCoursePage } from "@/components/funnel/FreeCoursePage";

export const metadata: Metadata = {
  alternates: { canonical: "/free-course" },
  title: "Free AI Marketing Course for Home Service Businesses | Sovereign AI",
  description:
    "Learn how to install an AI chatbot, automate reviews, and book leads 24/7. Free 5-lesson course — no credit card required.",
  openGraph: {
    title: "Free AI Marketing Course | Sovereign AI",
    description:
      "5-lesson video course: install an AI chatbot, automate review requests, and set up 24/7 lead capture for your home service business.",
    url: "/free-course",
  },
};

export default function FreeCourseRoute() {
  return <FreeCoursePage />;
}
