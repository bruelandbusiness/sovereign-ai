import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ErrorSeverity } from "@/lib/monitoring/error-logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types for parsed metadata
// ---------------------------------------------------------------------------

interface StoredErrorDetail {
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  source?: string;
  accountId?: string;
  extra?: Record<string, unknown>;
  timestamp: string;
}

interface GroupedError {
  message: string;
  severity: ErrorSeverity;
  stack?: string;
  url?: string;
  source?: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  fingerprint: string;
}

// ---------------------------------------------------------------------------
// GET /api/admin/errors
//
// Query params:
//   severity  - Filter by severity level (info | warn | error | critical)
//   since     - ISO date string; only return errors after this date
//   limit     - Max results (default 50, max 200)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { searchParams } = request.nextUrl;
  const severity = searchParams.get("severity") as ErrorSeverity | null;
  const since = searchParams.get("since");
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10) || 50, 1), 200);

  // Build where clause
  const where: Record<string, unknown> = {
    action: "error_captured",
    resource: "monitoring",
  };

  if (since) {
    const sinceDate = new Date(since);
    if (!isNaN(sinceDate.getTime())) {
      where.createdAt = { gte: sinceDate };
    }
  }

  try {
  // Fetch raw audit logs
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit * 3, // Over-fetch to allow grouping
  });

  // Parse metadata and optionally filter by severity
  const parsed: Array<{ detail: StoredErrorDetail; fingerprint: string; createdAt: Date }> = [];

  for (const log of logs) {
    if (!log.metadata) continue;
    try {
      const detail = JSON.parse(log.metadata) as StoredErrorDetail;
      if (severity && detail.severity !== severity) continue;
      parsed.push({
        detail,
        fingerprint: log.resourceId ?? detail.message,
        createdAt: log.createdAt,
      });
    } catch {
      // Skip malformed metadata
    }
  }

  // Group by fingerprint
  const groups = new Map<string, GroupedError>();

  for (const entry of parsed) {
    const key = entry.fingerprint;
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      const ts = entry.createdAt.toISOString();
      if (ts < existing.firstSeen) existing.firstSeen = ts;
      if (ts > existing.lastSeen) existing.lastSeen = ts;
    } else {
      const ts = entry.createdAt.toISOString();
      groups.set(key, {
        message: entry.detail.message,
        severity: entry.detail.severity,
        stack: entry.detail.stack,
        url: entry.detail.url,
        source: entry.detail.source,
        count: 1,
        firstSeen: ts,
        lastSeen: ts,
        fingerprint: key,
      });
    }
  }

  // Sort by lastSeen desc and apply limit
  const errors = Array.from(groups.values())
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, limit);

  return NextResponse.json({
    errors,
    total: errors.length,
    timestamp: new Date().toISOString(),
  });
  } catch (error) {
    logger.errorWithCause("[admin/errors] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
