import { getSession } from "@/lib/auth";

/**
 * Extracts and validates the client from the current session.
 *
 * Returns the session and clientId if the user is authenticated and has a linked client.
 * Throws a typed error that can be used for HTTP responses.
 */
export interface ClientSession {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  clientId: string;
  accountId: string;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Safely extract a message string from an unknown caught value.
 *
 * In TypeScript, caught errors are always `unknown`. This helper avoids the
 * common but unsafe `(e as Error).message` pattern.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

/**
 * Call at the top of client-facing API routes.
 *
 * Validates the FULL chain:
 *   1. Session cookie exists and maps to a valid, non-expired session
 *   2. Session has an associated account
 *   3. Account has a linked client record
 *   4. If the client has a subscription, it is not canceled/expired
 *
 * Usage:
 *   const { clientId, accountId, session } = await requireClient();
 *
 * Throws AuthError with:
 *   - 401 if not logged in or session is invalid/expired
 *   - 403 if no client linked, or subscription is canceled/expired
 */
export async function requireClient(): Promise<ClientSession> {
  let session: Awaited<ReturnType<typeof getSession>>;
  try {
    session = await getSession();
  } catch (err) {
    // Wrap unexpected errors (e.g. Prisma connection failures) so that
    // callers who forward `getErrorMessage(e)` never leak internal
    // details like database connection strings or stack traces.
    console.error("[requireClient] Session lookup failed:", err);
    throw new AuthError("Internal error", 500);
  }

  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }

  const client = session.account.client;
  if (!client) {
    throw new AuthError("Forbidden: no client linked to this account", 403);
  }

  // Defense-in-depth: getSession() already rejects canceled/expired subscriptions,
  // but verify here as well in case the check was bypassed or the code changes.
  // Note: subscription is not included in the session query by default,
  // so we skip this check if it's not available.
  const sub = (client as Record<string, unknown>).subscription as { status: string } | undefined;
  if (sub && (sub.status === "canceled" || sub.status === "expired")) {
    throw new AuthError("Forbidden: subscription is inactive", 403);
  }

  return {
    session,
    clientId: client.id,
    accountId: session.account.id,
  };
}
