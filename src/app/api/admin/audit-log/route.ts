import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimit, setRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

/**
 * GET /api/admin/audit-log
 *
 * Returns paginated audit log entries with optional filters.
 *
 * Query params:
 *   page      - Page number (1-based, default 1)
 *   limit     - Items per page (1-200, default 50)
 *   action    - Filter by action type (exact match)
 *   accountId - Filter by account ID
 *   from      - Start date (ISO 8601, inclusive)
 *   to        - End date (ISO 8601, inclusive)
 */
export async function GET(request: NextRequest) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  // Rate limit: 120 requests per minute for admin audit log reads
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const rl = await rateLimit(`admin-audit-log:${ip}`, 120, 2);
  if (!rl.allowed) {
    const res = NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
    return setRateLimitHeaders(res, rl);
  }

  try {
    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10)),
    );
    const action = url.searchParams.get("action") || undefined;
    const filterAccountId = url.searchParams.get("accountId") || undefined;
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (filterAccountId) {
      where.accountId = filterAccountId;
    }

    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          createdAt.gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          // Include the full "to" day
          toDate.setHours(23, 59, 59, 999);
          createdAt.lte = toDate;
        }
      }
      if (Object.keys(createdAt).length > 0) {
        where.createdAt = createdAt;
      }
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      entries,
      total,
      page,
      limit,
      totalPages,
    });
    response.headers.set("Cache-Control", "private, max-age=5");
    setRateLimitHeaders(response, rl);

    logger.info("[admin/audit-log] GET", {
      adminId: accountId,
      page,
      limit,
      total,
    });

    return response;
  } catch (error) {
    logger.errorWithCause("[admin/audit-log] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log entries" },
      { status: 500 },
    );
  }
}
