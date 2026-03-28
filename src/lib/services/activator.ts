import { prisma } from "@/lib/db";
import { provisionChatbot } from "./chatbot";
import { provisionReviews } from "./reviews";
import { provisionContent } from "./content";
import { provisionEmail } from "./email";
import { provisionBooking } from "./booking";
import { provisionLeadGen } from "./lead-gen";
import { provisionVoice } from "./voice";
import { provisionSeo } from "./seo";
import { provisionAds } from "./ads";
import { provisionSocial } from "./social";
import { provisionCRM } from "./crm";
import { provisionWebsite } from "./website";
import { provisionAnalytics } from "./analytics";
import { provisionReputation } from "./reputation";
import { provisionRetargeting } from "./retargeting";
import { provisionAEO } from "./aeo";
import { provisionReceptionist } from "./receptionist";
import { provisionAIEstimate } from "./ai-estimate";
import { provisionFSMSync } from "./fsm-sync";
import { provisionCustomerLTV } from "./customer-ltv";
import { buildServiceActivatedEmail } from "@/lib/emails/service-activated";
import { queueEmail } from "@/lib/email-queue";

import { logger } from "@/lib/logger";
/**
 * Activate a service for a client. Auto-provisions all services so customers
 * get a fully-configured dashboard immediately after payment.
 */
export async function activateService(clientId: string, serviceId: string) {
  // Idempotency: skip if the service is already active
  const existing = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId } },
  });
  if (existing?.status === "active") return;

  const clientService = await prisma.clientService.upsert({
    where: { clientId_serviceId: { clientId, serviceId } },
    create: { clientId, serviceId, status: "provisioning" },
    update: { status: "provisioning" },
  });

  try {
    switch (serviceId) {
      // --- Core engagement services ---
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

      // --- Lead generation & voice ---
      case "lead-gen":
        await provisionLeadGen(clientId);
        break;
      case "voice-agent":
        await provisionVoice(clientId);
        break;

      // --- Marketing & growth ---
      case "seo":
        await provisionSeo(clientId);
        break;
      case "ads":
        await provisionAds(clientId);
        break;
      case "social":
        await provisionSocial(clientId);
        break;

      // --- Operations & management ---
      case "crm":
        await provisionCRM(clientId);
        break;
      case "website":
        await provisionWebsite(clientId);
        break;
      case "analytics":
        await provisionAnalytics(clientId);
        break;

      // --- Brand & retargeting ---
      case "reputation":
        await provisionReputation(clientId);
        break;
      case "retargeting":
        await provisionRetargeting(clientId);
        break;

      // --- Marketplace / add-on services ---
      case "aeo":
        await provisionAEO(clientId);
        break;
      case "ai-receptionist":
        await provisionReceptionist(clientId);
        break;
      case "ai-estimate":
        await provisionAIEstimate(clientId);
        break;
      case "fsm-sync":
        await provisionFSMSync(clientId);
        break;
      case "customer-ltv":
        await provisionCustomerLTV(clientId);
        break;

      // --- Custom / catch-all ---
      case "custom":
      default:
        // Custom plans — mark active, team configures manually
        break;
    }

    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { status: "active", activatedAt: new Date() },
    });

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "service_update",
        title: `Service activated: ${serviceId}`,
        description: `Your ${serviceId} service is now live and working.`,
      },
    });

    // Send service-activated email notification
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { account: { select: { email: true } } },
      });
      if (client?.account?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
        const unsubUrl = `${appUrl}/api/email/unsubscribe?clientId=${clientId}`;
        const { subject, html } = buildServiceActivatedEmail(
          client.ownerName || "there",
          client.businessName,
          serviceId,
          `${appUrl}/dashboard`,
          unsubUrl,
        );
        await queueEmail(client.account.email, subject, html).catch((err) => {
          logger.warnWithCause("[activator] Failed to queue service-activated email", err, {
            clientId,
            serviceId,
          });
        });
      }
    } catch (err) {
      // Non-critical: don't fail activation if email fails
      logger.warnWithCause("[activator] Failed to send service-activated notification", err, {
        clientId,
        serviceId,
      });
    }
  } catch (error) {
    logger.errorWithCause(`[activator] Failed to activate ${serviceId} for ${clientId}`, error);
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { status: "provisioning_failed" },
    });

    // Log the failure so the team can investigate
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "service_update",
        title: `Service provisioning failed: ${serviceId}`,
        description: `Automatic provisioning for ${serviceId} encountered an error. Our team has been notified and will resolve this shortly.`,
      },
    }).catch((err) => {
      logger.warnWithCause("[activator] Failed to log provisioning failure event", err);
    });
  }
}

/**
 * Activate all services in a list for a given client.
 * Each service is activated independently so a failure in one
 * does not prevent the others from provisioning.
 *
 * @returns An array of serviceIds that failed to provision (empty on full success).
 */
export async function activateServices(
  clientId: string,
  serviceIds: string[]
): Promise<string[]> {
  const failed: string[] = [];
  for (const serviceId of serviceIds) {
    try {
      await activateService(clientId, serviceId);
    } catch (error) {
      logger.errorWithCause(`activateServices: failed to activate ${serviceId}`, error);
      failed.push(serviceId);
    }
  }
  return failed;
}
