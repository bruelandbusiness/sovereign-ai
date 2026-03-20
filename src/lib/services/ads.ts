import { prisma } from "@/lib/db";

/**
 * Provision the ad management service for a client.
 * Creates a starter draft campaign so the client can see the dashboard immediately.
 */
export async function provisionAds(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Check if any campaigns already exist
  const existing = await prisma.adCampaign.findFirst({
    where: { clientId },
  });

  if (!existing) {
    await prisma.adCampaign.create({
      data: {
        clientId,
        platform: "google",
        name: `${client.businessName} — Search Campaign`,
        status: "draft",
        budget: 2000, // $20/day default
        targeting: JSON.stringify({
          location: client.city && client.state ? `${client.city}, ${client.state}` : undefined,
          keywords: client.vertical
            ? [`${client.vertical} near me`, `best ${client.vertical}`, `${client.vertical} services`]
            : ["local services near me"],
        }),
        adCopy: JSON.stringify({
          headline: `${client.businessName} — Trusted Pros`,
          description: `Professional ${client.vertical ?? "home service"} in ${client.city ?? "your area"}. Free quotes. Licensed & insured.`,
          callToAction: "Get Free Quote",
        }),
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "ad_optimized",
      title: "Ad management activated",
      description: `A starter Google Ads campaign draft has been created for ${client.businessName}. Review and launch it from your dashboard.`,
    },
  });
}
