import { prisma } from "@/lib/db";
import { sendPushNotification } from "@/lib/push-notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateNotificationOptions {
  accountId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  /** When true, also sends a web push notification (for urgent events). */
  urgent?: boolean;
}

// ---------------------------------------------------------------------------
// Notification types that are considered urgent and should trigger push.
// ---------------------------------------------------------------------------

const URGENT_TYPES = new Set([
  "billing",
  "approval_required",
  "lead_captured",
  "lead",
  "booking",
  "review_received",
]);

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

/**
 * Create a notification in the database and optionally send a push
 * notification for urgent events.
 *
 * Use this instead of calling `prisma.notification.create()` directly so
 * that push delivery, actionUrl inclusion, and urgency logic stay in one
 * place.
 */
export async function createNotification(
  opts: CreateNotificationOptions
) {
  const { accountId, type, title, message, actionUrl, urgent } = opts;

  const notification = await prisma.notification.create({
    data: {
      accountId,
      type,
      title,
      message,
      actionUrl: actionUrl ?? null,
    },
  });

  // Send push for explicitly-urgent notifications or auto-urgent types
  const shouldPush = urgent === true || (urgent !== false && URGENT_TYPES.has(type));

  if (shouldPush) {
    // Fire-and-forget: don't block the caller if push delivery fails
    sendPushNotification(accountId, {
      title,
      body: message,
      url: actionUrl,
    }).catch((err) => {
      console.error(
        `[notifications] Push delivery failed for account ${accountId}:`,
        err instanceof Error ? err.message : err
      );
    });
  }

  return notification;
}

/**
 * Convenience: resolve a clientId to its accountId before creating the
 * notification. Returns null if the client is not found.
 */
export async function createNotificationForClient(
  clientId: string,
  opts: Omit<CreateNotificationOptions, "accountId">
) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { accountId: true },
  });
  if (!client) return null;

  return createNotification({ ...opts, accountId: client.accountId });
}
