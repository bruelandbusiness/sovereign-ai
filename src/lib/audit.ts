import { prisma } from "@/lib/db";
import { headers } from "next/headers";

interface AuditLogParams {
  accountId: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Capture the client IP address from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
async function getRequestIP(): Promise<string | null> {
  try {
    const hdrs = await headers();
    return (
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip") ||
      hdrs.get("cf-connecting-ip") ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Create an AuditLog entry.
 *
 * Usage:
 *   await logAudit({ accountId: session.account.id, action: "update", resource: "client", resourceId: client.id });
 */
export async function logAudit({
  accountId,
  action,
  resource,
  resourceId,
  metadata,
}: AuditLogParams): Promise<void> {
  const ip = await getRequestIP();

  const metaObj: Record<string, unknown> = { ...metadata };
  if (ip) {
    metaObj.ip = ip;
  }

  await prisma.auditLog.create({
    data: {
      accountId,
      action,
      resource,
      resourceId: resourceId ?? null,
      metadata: Object.keys(metaObj).length > 0 ? JSON.stringify(metaObj) : null,
    },
  });
}
