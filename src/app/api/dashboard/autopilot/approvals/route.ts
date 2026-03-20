import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { processApproval } from "@/lib/governance/approvals";
import { z } from "zod";

const approvalSchema = z.object({
  requestId: z.string().min(1).max(100),
  decision: z.enum(["approved", "rejected"]),
});

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const approvals = await prisma.approvalRequest.findMany({
      where: { clientId, status: "pending", expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      approvals.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        description: a.description,
        status: a.status,
        expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[autopilot/approvals] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { accountId, clientId } = await requireClient();
    const body = await request.json();
    const parsed = approvalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { requestId, decision } = parsed.data;

    // Verify the approval belongs to this client
    const approval = await prisma.approvalRequest.findFirst({
      where: { id: requestId, clientId },
    });
    if (!approval) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      await processApproval(requestId, decision, accountId);
    } catch (err) {
      console.error("[autopilot/approvals] processApproval failed:", err);
      return NextResponse.json({ error: "Failed to process approval" }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[autopilot/approvals] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}
