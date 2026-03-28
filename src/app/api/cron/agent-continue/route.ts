import { NextResponse } from "next/server";
import { withCronMonitoring } from "@/lib/cron-monitor";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { executeAgent, STALE_EXECUTION_THRESHOLD_MS } from "@/lib/agents/runner";
import { agentDefinitions } from "@/lib/agents/definitions/index";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronMonitoring("cron/agent-continue", async (_request) => {

  try {
    // ----------------------------------------------------------------
    // 1. Resume paused executions whose approval has been granted
    // ----------------------------------------------------------------
    // Atomically claim paused executions that have at least one approved
    // approval request.  The UPDATE ... RETURNING pattern ensures that if two
    // cron invocations overlap, each execution is claimed by exactly one.
    const claimedExecutions = await prisma.$queryRaw<
      Array<{
        id: string;
        clientId: string;
        agentType: string;
        status: string;
        input: unknown;
        output: unknown | null;
        startedAt: Date | null;
        completedAt: Date | null;
        error: string | null;
        totalTokens: number;
        totalCostCents: number;
        triggeredBy: string | null;
        createdAt: Date;
      }>
    >(
      Prisma.sql`UPDATE "AgentExecution"
       SET "status" = 'running'
       WHERE "id" IN (
         SELECT ae."id"
         FROM "AgentExecution" ae
         WHERE ae."status" = 'paused'
           AND EXISTS (
             SELECT 1 FROM "ApprovalRequest" ar
             WHERE ar."agentExecutionId" = ae."id"
               AND ar."status" = 'approved'
           )
       )
       RETURNING *`
    );

    let resumed = 0;

    for (const execution of claimedExecutions) {
      const definition = agentDefinitions[execution.agentType];
      if (!definition) continue;

      try {
        await executeAgent(definition, execution.id);
        resumed++;
      } catch (error) {
        logger.errorWithCause(`Failed to resume agent ${execution.id}`, error);
      }
    }

    // ----------------------------------------------------------------
    // 2. Recover stuck "running" executions
    // ----------------------------------------------------------------
    // If an execution has been in "running" status for longer than the
    // stale threshold, the process that was running it likely crashed.
    // Mark them as failed so they don't stay stuck forever.
    const staleThreshold = new Date(
      Date.now() - STALE_EXECUTION_THRESHOLD_MS
    );

    const staleResult = await prisma.$executeRaw`
      UPDATE "AgentExecution"
      SET "status" = 'failed',
          "error" = 'Execution timed out (stuck in running state)',
          "completedAt" = NOW()
      WHERE "status" = 'running'
        AND "startedAt" IS NOT NULL
        AND "startedAt" < ${staleThreshold}
    `;

    // ----------------------------------------------------------------
    // 3. Expire paused executions whose approvals have all expired
    // ----------------------------------------------------------------
    // If an execution is paused but all its approval requests have
    // expired (none approved), fail the execution to avoid indefinite limbo.
    const expiredPausedResult = await prisma.$executeRaw`
      UPDATE "AgentExecution"
      SET "status" = 'failed',
          "error" = 'All approval requests expired',
          "completedAt" = NOW()
      WHERE "status" = 'paused'
        AND NOT EXISTS (
          SELECT 1 FROM "ApprovalRequest" ar
          WHERE ar."agentExecutionId" = "AgentExecution"."id"
            AND ar."status" IN ('pending', 'approved')
        )
    `;

    // ----------------------------------------------------------------
    // 4. Fail queued executions that were never picked up
    // ----------------------------------------------------------------
    // If an execution has been queued for more than the stale threshold
    // it was likely orphaned by a crashed launcher.
    const staleQueuedResult = await prisma.$executeRaw`
      UPDATE "AgentExecution"
      SET "status" = 'failed',
          "error" = 'Execution was never started (orphaned in queue)',
          "completedAt" = NOW()
      WHERE "status" = 'queued'
        AND "createdAt" < ${staleThreshold}
    `;

    return NextResponse.json({
      ok: true,
      claimed: claimedExecutions.length,
      resumed,
      staleRecovered: Number(staleResult),
      expiredPaused: Number(expiredPausedResult),
      staleQueued: Number(staleQueuedResult),
    });
  } catch (error) {
    logger.errorWithCause("[cron/agent-continue] Error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
});
