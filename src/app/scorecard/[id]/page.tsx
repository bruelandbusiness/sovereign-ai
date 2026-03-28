import type { Metadata } from "next";
import { ShareableScorecardView } from "@/components/audit/ShareableScorecardView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

  // Fetch the audit to populate OG tags
  try {
    const res = await fetch(`${baseUrl}/api/audit/instant?id=${id}`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        title: `${data.businessName} scored ${data.score}/100 | Sovereign AI`,
        description: `${data.businessName} in ${data.city}, ${data.state} received a business health score of ${data.score}/100. Get your free score now.`,
        openGraph: {
          title: `${data.businessName} scored ${data.score}/100`,
          description: `See how ${data.businessName} stacks up against local competitors. Get your own free score.`,
          type: "website",
        },
      };
    }
  } catch {
    // Fall through to defaults
  }

  return {
    title: "Business Health Score | Sovereign AI",
    description: "See this business health score and get your own free score.",
  };
}

export default async function SharedScorecardPage({ params }: PageProps) {
  const { id } = await params;
  return <ShareableScorecardView id={id} />;
}
