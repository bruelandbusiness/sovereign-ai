import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/webinar" },
  title: "Free Live Demo: See Sovereign AI in Action | Sovereign AI",
  description:
    "Register for our free 45-minute live demo. See how AI answers 100% of your calls, generates 50+ leads per month, and manages reviews on autopilot. Live Q&A included.",
  keywords: [
    "sovereign ai demo",
    "ai marketing webinar",
    "home service marketing demo",
    "ai lead generation demo",
    "contractor marketing webinar",
    "hvac marketing demo",
    "plumbing marketing webinar",
    "ai call answering demo",
  ],
  openGraph: {
    title: "See Sovereign AI in Action — Free Live Demo & Q&A",
    description:
      "45-minute live demo: see how contractors generate 50+ qualified leads per month with AI-powered marketing. Register free.",
    url: "https://www.trysovereignai.com/webinar",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sovereign AI Live Demo — Free Webinar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Live Demo: See Sovereign AI in Action",
    description:
      "Register for our free 45-minute live demo. See how AI generates 50+ leads per month for home service businesses.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WebinarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
