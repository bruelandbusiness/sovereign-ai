import type { Metadata } from "next";
import { PartnerAuditPage } from "@/components/funnel/PartnerAuditPage";

interface PartnerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PartnerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `Free AI Marketing Audit — Exclusive Partner Offer from ${name}`,
    description: `Get a free, instant AI audit of your online marketing. Exclusive offer through our partner ${name}. See your score in 30 seconds.`,
    openGraph: {
      title: `Free AI Marketing Audit — Partner Offer from ${name}`,
      description: `Get a free, instant AI audit of your online marketing. Exclusive offer through our partner ${name}.`,
      url: `/partner/${slug}`,
    },
  };
}

export default async function PartnerPage({ params }: PartnerPageProps) {
  const { slug } = await params;
  return <PartnerAuditPage slug={slug} />;
}
