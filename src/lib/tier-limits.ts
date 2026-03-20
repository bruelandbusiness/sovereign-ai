import { prisma } from "@/lib/db";

interface TierCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}

/**
 * Check if a client has exceeded their free tier limits for a given service.
 * Returns { allowed: true } for paid subscribers.
 */
export async function checkFreeTierLimit(
  clientId: string,
  service: "chatbot" | "leads"
): Promise<TierCheckResult> {
  const subscription = await prisma.subscription.findFirst({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  // Paid subscribers (active or canceling) have no limits
  if (subscription && !subscription.isTrial && ["active", "canceling"].includes(subscription.status)) {
    return { allowed: true };
  }

  // Free/trial tier limits
  const LIMITS = {
    chatbot: 50,
    leads: 50,
  };

  const limit = LIMITS[service];

  if (service === "chatbot") {
    const count = await prisma.chatbotConversation.count({
      where: { chatbot: { clientId } },
    });
    if (count >= limit) {
      return { allowed: false, reason: `Free tier limited to ${limit} chatbot conversations. Upgrade to continue.`, current: count, limit };
    }
  }

  if (service === "leads") {
    const count = await prisma.lead.count({ where: { clientId } });
    if (count >= limit) {
      return { allowed: false, reason: `Free tier limited to ${limit} leads. Upgrade to continue.`, current: count, limit };
    }
  }

  return { allowed: true };
}
