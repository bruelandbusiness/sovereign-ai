import { getSession } from "@/lib/auth";
import { AuthError } from "@/lib/require-client";

/**
 * Ordered role hierarchy from least to most privileged.
 *
 * viewer  – read-only access to admin dashboards
 * manager – can edit content and manage clients
 * admin   – full admin access (current default for admin routes)
 * superadmin – destructive operations (impersonation, deletion)
 */
const ROLE_HIERARCHY = ["viewer", "manager", "admin", "superadmin"] as const;

export type AdminRole = (typeof ROLE_HIERARCHY)[number];

/**
 * Session data returned by role-gated admin helpers.
 */
export interface AdminSession {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  accountId: string;
}

/**
 * Returns the numeric rank for a role, or -1 if the role is unknown.
 */
function roleRank(role: string): number {
  return ROLE_HIERARCHY.indexOf(role as AdminRole);
}

/**
 * Generic role gate for admin API routes.
 *
 * Validates:
 *   1. Session cookie exists and maps to a valid, non-expired session
 *   2. Session account role is at or above `minimumRole` in the hierarchy
 *
 * Usage:
 *   const { accountId, session } = await requireRole("manager");
 *
 * Throws AuthError with:
 *   - 401 if not logged in or session is invalid/expired
 *   - 403 if the account role is below the required minimum
 */
export async function requireRole(
  minimumRole: AdminRole,
): Promise<AdminSession> {
  const session = await getSession();

  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }

  const accountRole = session.account.role;
  const accountRank = roleRank(accountRole);
  const requiredRank = roleRank(minimumRole);

  if (accountRank < 0 || accountRank < requiredRank) {
    throw new AuthError("Forbidden", 403);
  }

  return {
    session,
    accountId: session.account.id,
  };
}

/**
 * Call at the top of admin API routes.
 *
 * Validates:
 *   1. Session cookie exists and maps to a valid, non-expired session
 *   2. Session account has role >= "admin"
 *
 * Usage:
 *   const { accountId, session } = await requireAdmin();
 *
 * Throws AuthError with:
 *   - 401 if not logged in or session is invalid/expired
 *   - 403 if the account role is not "admin"
 */
export async function requireAdmin(): Promise<AdminSession> {
  return requireRole("admin");
}

/**
 * Call at the top of destructive admin API routes (impersonation, deletion).
 *
 * Validates:
 *   1. Session cookie exists and maps to a valid, non-expired session
 *   2. Session account has role === "superadmin"
 *
 * Usage:
 *   const { accountId, session } = await requireSuperAdmin();
 *
 * Throws AuthError with:
 *   - 401 if not logged in or session is invalid/expired
 *   - 403 if the account role is not "superadmin"
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  return requireRole("superadmin");
}
