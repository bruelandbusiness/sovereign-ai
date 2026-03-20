import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET — Call logs for the AI Receptionist dashboard
//
// Query params:
//   page    (default 1)
//   limit   (default 20, max 100)
//   search  (optional — filters by callerPhone or callerName)
//   status  (optional — filter by status)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;
  const url = request.nextUrl;

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10))
  );
  const search = url.searchParams.get("search") ?? "";
  const statusFilter = url.searchParams.get("status") ?? "";
  const offset = (page - 1) * limit;

  // Build where clause
  interface CallLogWhere {
    clientId: string;
    status?: string;
    OR?: Array<{
      callerPhone?: { contains: string };
      callerName?: { contains: string };
      summary?: { contains: string };
    }>;
  }

  const where: CallLogWhere = { clientId };

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (search) {
    where.OR = [
      { callerPhone: { contains: search } },
      { callerName: { contains: search } },
      { summary: { contains: search } },
    ];
  }

  const [calls, totalCount] = await Promise.all([
    prisma.callLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.callLog.count({ where }),
  ]);

  return NextResponse.json({
    calls: calls.map((call) => ({
      id: call.id,
      callerPhone: call.callerPhone,
      callerName: call.callerName,
      duration: call.duration,
      status: call.status,
      sentiment: call.sentiment,
      summary: call.summary,
      transcript: call.transcript,
      isEmergency: call.isEmergency,
      bookingCreated: call.bookingCreated,
      bookingId: call.bookingId,
      leadCreated: call.leadCreated,
      leadId: call.leadId,
      recordingUrl: call.recordingUrl,
      createdAt: call.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
