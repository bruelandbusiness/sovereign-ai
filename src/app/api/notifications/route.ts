import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const markReadSchema = z.object({
  ids: z.array(z.string().max(100)).max(100).optional(),
});

const dismissSchema = z.object({
  ids: z.array(z.string().max(100)).min(1).max(100),
});
export async function GET(request: Request) {
  try {
    // Rate limit: 60 requests per IP per hour
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "notifications", 60);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = { accountId: session.account.id };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ read: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          read: true,
          actionUrl: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
    ]);

    const data = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      actionUrl: n.actionUrl,
      createdAt: n.createdAt.toISOString(),
    }));

    const response = NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    response.headers.set(
      "Cache-Control",
      "private, max-age=10, stale-while-revalidate=5"
    );

    return response;
  } catch (error) {
    logger.errorWithCause("[notifications] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { ids } = parsed.data;

    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          accountId: session.account.id,
        },
        data: { read: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { accountId: session.account.id, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause("[notifications] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — Dismiss (delete) notifications by id
// ---------------------------------------------------------------------------

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = dismissSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { ids } = parsed.data;

    await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        accountId: session.account.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause("[notifications] DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to dismiss notifications" },
      { status: 500 }
    );
  }
}
