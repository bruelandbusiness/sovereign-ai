import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const executions = await prisma.agentExecution.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: { select: { steps: true } },
        steps: { where: { status: "completed" }, select: { id: true } },
      },
    });

    return NextResponse.json(
      executions.map((e) => ({
        id: e.id,
        agentType: e.agentType,
        status: e.status,
        startedAt: e.startedAt?.toISOString() || null,
        completedAt: e.completedAt?.toISOString() || null,
        totalTokens: e.totalTokens,
        triggeredBy: e.triggeredBy,
        createdAt: e.createdAt.toISOString(),
        stepCount: e._count.steps,
        completedSteps: e.steps.length,
      })),
    );
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[autopilot] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch autopilot data" },
      { status: 500 }
    );
  }
}
