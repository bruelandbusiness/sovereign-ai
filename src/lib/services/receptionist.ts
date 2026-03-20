import { prisma } from "@/lib/db";
import { twilioPhoneNumber } from "@/lib/twilio";

/**
 * Provision the AI Receptionist service for a client.
 * Creates a ReceptionistConfig record with defaults derived from the
 * client's business info and stores the Twilio phone number in the
 * ClientService config.
 */
export async function provisionReceptionist(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Create the ReceptionistConfig if it doesn't already exist
  const existing = await prisma.receptionistConfig.findUnique({
    where: { clientId },
  });

  if (!existing) {
    await prisma.receptionistConfig.create({
      data: {
        clientId,
        isActive: true,
        greeting: `Thank you for calling ${client.businessName}! How can I help you today?`,
        businessName: client.businessName,
        emergencyKeywords: JSON.stringify([
          "emergency",
          "flood",
          "leak",
          "fire",
          "no heat",
          "no AC",
          "burst pipe",
        ]),
        emergencyAction: "transfer",
        emergencyPhone: client.phone ?? undefined,
        voiceId: "alloy",
        maxCallMinutes: 10,
        collectInfo: JSON.stringify(["name", "phone", "address", "issue_description"]),
        canBookJobs: true,
      },
    });
  }

  // Update the ClientService record with the receptionist config
  const clientService = await prisma.clientService.findUnique({
    where: {
      clientId_serviceId: { clientId, serviceId: "ai-receptionist" },
    },
  });

  if (clientService) {
    const receptionistServiceConfig = {
      twilioPhoneNumber: twilioPhoneNumber ?? "pending-assignment",
      businessName: client.businessName,
      vertical: client.vertical ?? "home service",
    };

    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(receptionistServiceConfig) },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "call_booked",
      title: "AI Receptionist activated",
      description: `Your AI Receptionist is now live for ${client.businessName}. Incoming calls will be answered, qualified, and jobs will be booked automatically.`,
    },
  });
}
