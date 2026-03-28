import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Unified Inbox Helpers
//
// Groups all customer communication (SMS, email, chatbot, voice, social) into
// ConversationThreads so the dashboard can display a single inbox view.
// ---------------------------------------------------------------------------

interface AddToInboxInput {
  channel: "sms" | "email" | "chatbot" | "voice" | "social";
  direction: "inbound" | "outbound";
  senderName?: string | null;
  senderContact?: string | null; // phone, email, or handle
  content: string;
  metadata?: string | null;
}

/**
 * Add a message to the unified inbox. Finds or creates a ConversationThread
 * grouped by the contact's phone or email, then appends the message.
 */
export async function addToInbox(
  clientId: string,
  input: AddToInboxInput
) {
  const thread = await findOrCreateThread(
    clientId,
    input.senderContact ?? undefined,
    undefined, // contactEmail (derived from senderContact if it looks like email)
    input.channel
  );

  const message = await prisma.unifiedMessage.create({
    data: {
      clientId,
      threadId: thread.id,
      channel: input.channel,
      direction: input.direction,
      senderName: input.senderName ?? null,
      senderContact: input.senderContact ?? null,
      content: input.content,
      metadata: input.metadata ?? null,
    },
  });

  // Update the thread's lastMessageAt and contact name if we have it
  const updateData: Record<string, unknown> = {
    lastMessageAt: new Date(),
  };

  if (input.senderName && !thread.contactName) {
    updateData.contactName = input.senderName;
  }

  // Reopen the thread if it was closed and a new inbound message comes in
  if (input.direction === "inbound" && thread.status === "closed") {
    updateData.status = "open";
  }

  await prisma.conversationThread.update({
    where: { id: thread.id },
    data: updateData,
  });

  return { thread, message };
}

/**
 * Find an existing ConversationThread for this contact, or create one.
 * Groups by phone number or email within a client.
 */
async function findOrCreateThread(
  clientId: string,
  contactPhone?: string,
  contactEmail?: string,
  channel: string = "sms"
) {
  // Determine if senderContact is an email
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isEmail =
    !contactPhone &&
    contactEmail === undefined &&
    false; // handled below

  let resolvedPhone = contactPhone;
  let resolvedEmail = contactEmail;

  // If contactPhone looks like an email, treat it as email instead
  if (
    resolvedPhone &&
    resolvedPhone.includes("@") &&
    !resolvedPhone.startsWith("+")
  ) {
    resolvedEmail = resolvedPhone;
    resolvedPhone = undefined;
  }

  // Try to find an existing thread by phone number
  if (resolvedPhone) {
    const existing = await prisma.conversationThread.findFirst({
      where: {
        clientId,
        contactPhone: resolvedPhone,
      },
      orderBy: { lastMessageAt: "desc" },
    });

    if (existing) return existing;
  }

  // Try to find an existing thread by email
  if (resolvedEmail) {
    const existing = await prisma.conversationThread.findFirst({
      where: {
        clientId,
        contactEmail: resolvedEmail,
      },
      orderBy: { lastMessageAt: "desc" },
    });

    if (existing) return existing;
  }

  // Create a new thread
  return prisma.conversationThread.create({
    data: {
      clientId,
      contactPhone: resolvedPhone ?? null,
      contactEmail: resolvedEmail ?? null,
      channel,
      status: "open",
      lastMessageAt: new Date(),
    },
  });
}
