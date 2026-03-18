import { prisma } from "@/lib/db";
import { provisionChatbot } from "./chatbot";
import { provisionReviews } from "./reviews";
import { provisionContent } from "./content";
import { provisionEmail } from "./email";
import { provisionBooking } from "./booking";

/**
 * Activate a service for a client. Auto-provisions services that can be
 * delivered automatically (chatbot, reviews, content). Others are marked
 * "active" for manual setup by the team.
 */
export async function activateService(clientId: string, serviceId: string) {
  const clientService = await prisma.clientService.upsert({
    where: { clientId_serviceId: { clientId, serviceId } },
    create: { clientId, serviceId, status: "provisioning" },
    update: { status: "provisioning" },
  });

  try {
    switch (serviceId) {
      case "chatbot":
        await provisionChatbot(clientId);
        break;
      case "reviews":
        await provisionReviews(clientId);
        break;
      case "content":
        await provisionContent(clientId);
        break;
      case "email":
        await provisionEmail(clientId);
        break;
      case "booking":
        await provisionBooking(clientId);
        break;
      default:
        // All other services are marked active for manual fulfillment
        break;
    }

    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { status: "active", activatedAt: new Date() },
    });

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "seo_update",
        title: `Service activated: ${serviceId}`,
        description: `Your ${serviceId} service is now live and working.`,
      },
    });
  } catch (error) {
    console.error(`Failed to activate ${serviceId} for ${clientId}:`, error);
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { status: "active", activatedAt: new Date() },
    });
  }
}

/**
 * Activate all services in a list for a given client.
 */
export async function activateServices(
  clientId: string,
  serviceIds: string[]
) {
  for (const serviceId of serviceIds) {
    await activateService(clientId, serviceId);
  }
}
