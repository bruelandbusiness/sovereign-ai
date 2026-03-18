import { prisma } from "@/lib/db";

/**
 * Provision an AI chatbot for a client. Creates a ChatbotConfig with an
 * auto-generated system prompt based on the client's business info.
 */
export async function provisionChatbot(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const existing = await prisma.chatbotConfig.findUnique({
    where: { clientId },
  });

  if (existing) return existing;

  const systemPrompt = generateSystemPrompt(client);

  return prisma.chatbotConfig.create({
    data: {
      clientId,
      systemPrompt,
      greeting: `Hi there! 👋 Welcome to ${client.businessName}. How can we help you today?`,
      primaryColor: "#4c85ff",
      isActive: true,
    },
  });
}

function generateSystemPrompt(client: {
  businessName: string;
  ownerName: string;
  vertical: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  serviceAreaRadius: string | null;
}) {
  const location =
    client.city && client.state
      ? `${client.city}, ${client.state}`
      : "their local area";

  const serviceArea = client.serviceAreaRadius
    ? `within a ${client.serviceAreaRadius} mile radius`
    : "in the local area";

  return `You are a helpful and friendly AI assistant for ${client.businessName}, a ${client.vertical || "home service"} company located in ${location} serving customers ${serviceArea}.

Your role is to:
1. Answer questions about ${client.businessName}'s services, pricing, and availability
2. Help visitors schedule appointments or request quotes
3. Collect contact information (name, phone, email) from interested leads
4. Be warm, professional, and helpful at all times

Important guidelines:
- Always be enthusiastic about ${client.businessName}'s services
- If you don't know specific details (like exact pricing or schedule), say something like "Let me have someone get back to you with the exact details. Can I get your phone number?"
- Always try to capture the visitor's contact info naturally
- Keep responses concise — 2-3 sentences max
- If someone needs emergency service, tell them to call directly
- Never make up specific prices, schedules, or details you don't know
- Speak in a friendly, conversational tone — not overly formal

The owner is ${client.ownerName}. The business is known for quality ${client.vertical || "home service"} work in ${location}.`;
}
