import { prisma } from "@/lib/db";

/**
 * Push notification helpers for the Sovereign AI platform.
 *
 * Uses the `web-push` library with VAPID keys for proper Web Push Protocol
 * compliance. Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
 * environment variables for production.
 *
 * When VAPID keys are not configured, push delivery is skipped gracefully
 * with a warning log (notifications are still created in the database).
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@sovereignai.com";

/** Whether VAPID keys are configured for production push delivery. */
const isVapidConfigured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

// Log once at module load if VAPID is not configured
if (!isVapidConfigured && process.env.NODE_ENV === "production") {
  console.warn(
    "[push-notifications] VAPID keys not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). " +
    "Push notifications will be skipped. In-app notifications still work."
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Save a push subscription for an account.
 */
export async function subscribeToPush(
  accountId: string,
  subscription: PushSubscriptionData
) {
  return prisma.pushSubscription.upsert({
    where: {
      accountId_endpoint: {
        accountId,
        endpoint: subscription.endpoint,
      },
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      accountId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

/**
 * Remove a push subscription for an account.
 */
export async function unsubscribeFromPush(
  accountId: string,
  endpoint: string
) {
  return prisma.pushSubscription.deleteMany({
    where: { accountId, endpoint },
  });
}

/**
 * Send a push notification to all of a user's subscriptions.
 *
 * Requires `web-push` npm package and VAPID key environment variables.
 * When VAPID keys are not configured, returns immediately with `{ sent: 0, failed: 0 }`
 * so that the calling code (createNotification) is not affected -- in-app notifications
 * are always saved to the database regardless of push delivery status.
 */
export async function sendPushNotification(
  accountId: string,
  payload: PushPayload
) {
  // Gracefully skip push delivery when VAPID keys are not configured.
  // In-app notifications are still persisted by the caller (createNotification).
  if (!isVapidConfigured) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { accountId },
  });

  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  // Dynamic import: only load web-push when actually sending.
  // This avoids a hard dependency crash if the package isn't installed yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let webpush: any;
  try {
    // @ts-expect-error -- web-push is an optional peer dependency, installed at deploy time
    webpush = await import("web-push");
  } catch {
    console.error(
      "[push-notifications] web-push package not installed. Run: npm install web-push"
    );
    return { sent: 0, failed: 0 };
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
        return { status: "sent" as const };
      } catch (err: unknown) {
        // If the subscription is expired/invalid (410 Gone) or not found (404),
        // clean it up so we stop sending to a dead endpoint.
        const statusCode = err && typeof err === "object" && "statusCode" in err
          ? (err as { statusCode: number }).statusCode
          : undefined;
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
          return { status: "expired" as const };
        }
        console.error(
          `[push-notifications] Failed to send to ${sub.endpoint.slice(0, 60)}...`,
          statusCode ?? err
        );
        return { status: "failed" as const };
      }
    })
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && r.value.status === "sent"
  ).length;
  const failed = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.status === "failed")
  ).length;

  return { sent, failed };
}
