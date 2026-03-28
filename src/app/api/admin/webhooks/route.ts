import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError, apiPaginated } from "@/lib/api-response";
import { retryDeadLetter } from "@/lib/webhook-delivery";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/admin/webhooks — List webhook deliveries with filters
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    const message = e instanceof AuthError ? e.message : "Unauthorized";
    return apiError(message, status);
  }

  const { searchParams } = request.nextUrl;

  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10)),
  );

  const where: Record<string, unknown> = {};

  if (status && ["pending", "delivered", "failed", "dead_letter"].includes(status)) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) {
      const parsed = new Date(dateFrom);
      if (!isNaN(parsed.getTime())) createdAt.gte = parsed;
    }
    if (dateTo) {
      const parsed = new Date(dateTo);
      if (!isNaN(parsed.getTime())) createdAt.lte = parsed;
    }
    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }
  }

  try {
    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          endpoint: {
            select: {
              id: true,
              url: true,
              clientId: true,
            },
          },
        },
      }),
      prisma.webhookLog.count({ where }),
    ]);

    const data = logs.map((log) => ({
      id: log.id,
      endpointId: log.endpointId,
      endpointUrl: log.endpoint.url,
      clientId: log.endpoint.clientId,
      event: log.event,
      status: log.status,
      success: log.success,
      statusCode: log.statusCode,
      responseTimeMs: log.responseTimeMs,
      attempts: log.attempts,
      maxAttempts: log.maxAttempts,
      lastError: log.lastError,
      attemptLog: log.attemptLog,
      deliveredAt: log.deliveredAt?.toISOString() ?? null,
      deadLetteredAt: log.deadLetteredAt?.toISOString() ?? null,
      createdAt: log.createdAt.toISOString(),
    }));

    return apiPaginated(data, total, page, pageSize);
  } catch (err) {
    logger.errorWithCause("[admin/webhooks] Failed to list deliveries", err);
    return apiError("Failed to fetch webhook deliveries", 500);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/webhooks — Retry a dead letter entry
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    const message = e instanceof AuthError ? e.message : "Unauthorized";
    return apiError(message, status);
  }

  let body: { logId?: string };
  try {
    body = (await request.json()) as { logId?: string };
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const { logId } = body;
  if (!logId || typeof logId !== "string") {
    return apiError("logId is required", 400);
  }

  try {
    const result = await retryDeadLetter(logId);

    if (!result.success) {
      return apiError(result.error ?? "Retry failed", 400);
    }

    return apiSuccess({ message: "Retry initiated", logId });
  } catch (err) {
    logger.errorWithCause("[admin/webhooks] Retry failed", err, { logId });
    return apiError("Failed to retry delivery", 500);
  }
}
