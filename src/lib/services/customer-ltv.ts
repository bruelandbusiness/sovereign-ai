import { prisma } from "@/lib/db";
import { getTemplatesForVertical } from "@/lib/seasonal-templates";

/**
 * Provision the Customer LTV Engine for a client.
 * Creates default seasonal campaigns based on the client's vertical.
 */
export async function provisionCustomerLTV(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Check if seasonal campaigns already exist for this client
  const existingCampaigns = await prisma.seasonalCampaign.count({
    where: { clientId },
  });

  if (existingCampaigns === 0) {
    const templates = getTemplatesForVertical(client.vertical);

    // Create seasonal campaigns from templates
    await prisma.seasonalCampaign.createMany({
      data: templates.map((template) => ({
        clientId,
        name: template.name,
        vertical: template.vertical,
        season: template.season,
        triggerMonth: template.triggerMonth,
        subject: template.subject,
        body: template.body,
        discount: template.discount,
        isActive: true,
      })),
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "email_sent",
      title: "Customer LTV Engine activated",
      description: `Customer lifetime value tracking and seasonal campaigns are now active for ${client.businessName}. Maintenance reminders and seasonal campaigns will run automatically.`,
    },
  });
}
