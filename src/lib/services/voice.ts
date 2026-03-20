import { prisma } from "@/lib/db";
import { twilioPhoneNumber } from "@/lib/twilio";

/**
 * Provision the AI voice agent service for a client.
 * Stores the Twilio phone number in the ClientService config and
 * creates a welcome activity event.
 */
export async function provisionVoice(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const voiceConfig = {
    twilioPhoneNumber: twilioPhoneNumber ?? "pending-assignment",
    greeting: `Thank you for calling ${client.businessName}. How can we help you today?`,
    voiceName: "Polly.Joanna",
    recordCalls: true,
    transcribeEnabled: true,
  };

  // Update the ClientService record with voice config
  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "voice-agent" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(voiceConfig) },
    });
  }

  // Ensure the client has a chatbot config (used for the voice agent's system prompt)
  const chatbotConfig = await prisma.chatbotConfig.findUnique({
    where: { clientId },
  });

  if (!chatbotConfig) {
    // Create a minimal chatbot config so the voice agent has a system prompt
    await prisma.chatbotConfig.create({
      data: {
        clientId,
        systemPrompt: `You are a helpful and friendly AI phone assistant for ${client.businessName}, a ${client.vertical || "home service"} company. Answer questions about services, help schedule appointments, and collect caller contact information (name, email, phone). Keep responses brief and conversational — 1-2 sentences at most since this is a phone call.`,
        greeting: `Hi! Welcome to ${client.businessName}. How can we help you today?`,
        primaryColor: "#4c85ff",
        isActive: true,
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "call_booked",
      title: "Voice agent activated",
      description: `AI voice agent is now live for ${client.businessName}. Incoming calls will be answered by your AI assistant.`,
    },
  });
}
