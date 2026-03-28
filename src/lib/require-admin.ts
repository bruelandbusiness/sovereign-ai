import { getSession } from "@/lib/auth";
import { AuthError } from "@/lib/require-client";

/**
 * Session data returned by requireAdmin().
 */
export interface AdminSession {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  accountId: string;
}

/**
 * Call at the top of admin API routes.
 *
 * Validates:
 *   1. Session cookie exists and maps to a valid, non-expired session
 *   2. Session account has role === "admin"
 *
 * Usage:
 *   const { accountId, session } = await requireAdmin();
 *
 * Throws AuthError with:
 *   - 401 if not logged in or session is invalid/expired
 *   - 403 if the account role is not "admin"
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();

  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }

  if (session.account.role !== "admin") {
    throw new AuthError("Forbidden", 403);
  }

  return {
    session,
    accountId: session.account.id,
  };
}
