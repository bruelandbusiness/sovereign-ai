import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Tutorials | Sovereign AI",
  description:
    "Short video walkthroughs covering your dashboard, services, reports, reviews, leads, and support inside Sovereign AI.",
  alternates: { canonical: "/knowledge/tutorials" },
  openGraph: {
    title: "Video Tutorials | Sovereign AI",
    description:
      "Short video walkthroughs for Sovereign AI users.",
    url: "/knowledge/tutorials",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Tutorials | Sovereign AI",
    description:
      "Short video walkthroughs for Sovereign AI users.",
  },
};

export default function TutorialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
