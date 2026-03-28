import { prisma } from "@/lib/db";
import { createNotificationForClient } from "@/lib/notifications";

/**
 * Provision the AI Lead Generation service for a client.
 * Sets up the lead pipeline config, creates a sample lead so the dashboard
 * isn't empty, and configures the outreach domain defaults.
 */
export async function provisionLeadGen(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Set up service config with default lead-gen settings
  const leadGenConfig = {
    pipelineEnabled: true,
    autoQualify: true,
    leadScoringEnabled: true,
    channels: ["website", "chatbot", "phone", "referral", "voice"],
    followUpCadence: "24h",
    notifyOnNewLead: true,
  };

  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "lead-gen" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(leadGenConfig) },
    });
  }

  // Create a sample lead so the dashboard has data on first visit
  const existingLead = await prisma.lead.findFirst({
    where: { clientId },
  });

  if (!existingLead) {
    await prisma.lead.create({
      data: {
        clientId,
        name: "Sample Lead (Demo)",
        email: "demo@example.com",
        phone: "(555) 000-0000",
        source: "website",
        status: "new",
        stage: "warm",
        score: 72,
        value: 350000, // $3,500 estimated value
        notes: "This is a sample lead to show how your pipeline works. Real leads will appear here as they come in.",
      },
    });
  }

  await createNotificationForClient(clientId, {
    type: "service",
    title: "Lead Generation Pipeline Active",
    message: `Your AI-powered lead generation pipeline is now live. Leads from all channels will flow into your dashboard automatically.`,
    actionUrl: "/dashboard/leads",
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "lead_received",
      title: "Lead Generation activated",
      description: `AI lead generation pipeline is now live for ${client.businessName}. Leads from website, chatbot, phone, and referral sources will be captured, scored, and qualified automatically.`,
    },
  });
}
