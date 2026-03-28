import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const createAlertSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(50),
  config: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

const acknowledgeAlertSchema = z.object({
  id: z.string().min(1).max(100),
});

// ---------------------------------------------------------------------------
// GET — List AlertLogs, filterable by type/severity/resolved
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

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");
    const resolved = searchParams.get("resolved"); // "true" | "false"

    interface AlertWhere {
      type?: string;
      severity?: string;
      resolved?: boolean;
    }
    const where: AlertWhere = {};

    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (resolved === "true") where.resolved = true;
    if (resolved === "false") where.resolved = false;

    const alerts = await prisma.alertLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        ruleId: a.ruleId,
        type: a.type,
        title: a.title,
        message: a.message,
        severity: a.severity,
        resolved: a.resolved,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.errorWithCause("[api/admin/alerts] GET failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Mark alert as resolved
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = acknowledgeAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = parsed.data;

  try {
    const alert = await prisma.alertLog.findUnique({ where: { id } });
    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const updated = await prisma.alertLog.update({
      where: { id },
      data: { resolved: true },
    });

    await logAudit({
      accountId,
      action: "update",
      resource: "alert",
      resourceId: id,
      metadata: { resolved: true },
    });

    return NextResponse.json({
      alert: {
        id: updated.id,
        resolved: updated.resolved,
      },
    });
  } catch (error) {
    logger.errorWithCause("[api/admin/alerts] PUT failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Create AlertRule
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, type, config, enabled } = parsed.data;

  try {
    const rule = await prisma.alertRule.create({
      data: {
        name,
        type,
        config: JSON.stringify(config),
        enabled: enabled ?? true,
      },
    });

    await logAudit({
      accountId,
      action: "create",
      resource: "alertRule",
      resourceId: rule.id,
      metadata: { name, type },
    });

    return NextResponse.json({
      rule: {
        id: rule.id,
        name: rule.name,
        type: rule.type,
        config: rule.config,
        enabled: rule.enabled,
        createdAt: rule.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.errorWithCause("[api/admin/alerts] POST failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
