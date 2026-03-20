import { prisma } from "@/lib/db";

/**
 * Provision the social media management service for a client.
 * Creates a welcome post draft so the client can see the dashboard immediately.
 */
export async function provisionSocial(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Check if any social posts already exist
  const existing = await prisma.socialPost.findFirst({
    where: { clientId },
  });

  if (!existing) {
    await prisma.socialPost.create({
      data: {
        clientId,
        platform: "facebook",
        content: `Exciting news! ${client.businessName} is now offering enhanced online services to better serve our customers${client.city ? ` in ${client.city}` : ""}. Stay tuned for tips, updates, and special offers! #${(client.vertical ?? "homeservice").replace(/\s+/g, "")} #local #community`,
        status: "draft",
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "content_published",
      title: "Social media management activated",
      description: `A draft social media post has been created for ${client.businessName}. Schedule and publish posts from your dashboard.`,
    },
  });
}
