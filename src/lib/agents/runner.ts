import { prisma } from "@/lib/db";
import {
  estimateCost,
  guardedAICheck,
  recordAISpend,
} from "@/lib/governance/ai-guard";
import { requiresApproval, requestApproval } from "@/lib/governance/approvals";
import { createNotificationForClient } from "@/lib/notifications";
// Prisma types (fields are String? not Json)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentStepDef {
  action: string;
  execute: (context: StepContext) => Promise<StepResult>;
  requiresApproval?: boolean;
  /** How to handle a step failure. Defaults to "abort". */
  onFailure?: "abort" | "retry" | "skip";
  /** Maximum retries when onFailure is "retry". Defaults to 2. */
  maxRetries?: number;
}

export interface StepContext {
  clientId: string;
  executionId: string;
  stepNumber: number;
  input: Record<string, unknown>; // Accumulated from previous steps
  previousOutputs: Record<string, unknown>[];
}

export interface StepResult {
  output: Record<string, unknown>;
  tokensUsed?: number;
}

export interface AgentDefinition {
  type: string;
  description: string;
  steps: AgentStepDef[];
  /** Maximum cost in cents for the entire execution. Default: 50 ($0.50). */
  maxCostCents?: number;
  /** Maximum total tokens for the entire execution. Default: 100_000. */
  maxTokens?: number;
  /** Maximum wall-clock duration in ms. Default: 5 minutes. */
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_COST_CENTS = 50; // $0.50
const DEFAULT_MAX_TOKENS = 100_000;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
/** Executions stuck in "running" longer than this are considered stale. */
export const STALE_EXECUTION_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// Concurrency guard
// ---------------------------------------------------------------------------

/**
 * Atomically claim an execution by setting it to "running" only if it is
 * currently in the expected status. Returns true if the claim succeeded.
 *
 * This prevents two processes (e.g. overlapping cron invocations or a
 * launcher + cron race) from executing the same agent simultaneously.
 */
async function claimExecution(
  executionId: string,
  expectedStatus: string
): Promise<boolean> {
  const updated: number = await prisma.$executeRaw`
    UPDATE "AgentExecution"
    SET "status" = 'running',
        "startedAt" = COALESCE("startedAt", NOW())
    WHERE "id" = ${executionId}
      AND "status" = ${expectedStatus}
  `;
  return updated === 1;
}

/**
 * Prevent concurrent execution of the same agent type for the same client.
 * Returns true if there is already an active execution (queued/running/paused).
 */
async function hasActiveExecution(
  agentType: string,
  clientId: string,
  excludeExecutionId?: string
): Promise<boolean> {
  const where: Record<string, unknown> = {
    agentType,
    clientId,
    status: { in: ["queued", "running", "paused"] },
  };
  if (excludeExecutionId) {
    where.id = { not: excludeExecutionId };
  }
  const count = await prisma.agentExecution.count({ where });
  return count > 0;
}

// ---------------------------------------------------------------------------
// Main execution loop
// ---------------------------------------------------------------------------

/**
 * Execute an agent from the beginning or resume from a paused step.
 */
export async function executeAgent(
  definition: AgentDefinition,
  executionId: string
): Promise<void> {
  const execution = await prisma.agentExecution.findUnique({
    where: { id: executionId },
    include: { steps: { orderBy: { stepNumber: "asc" } } },
  });

  if (!execution) throw new Error(`Execution ${executionId} not found`);

  const { clientId: execClientId } = execution;

  // Determine expected pre-claim status
  const expectedStatus = execution.status; // "queued" or "paused" (or "running" for stale recovery)
  if (!["queued", "paused", "running"].includes(expectedStatus)) {
    // Already completed, failed, or cancelled -- nothing to do
    return;
  }

  // Atomically claim the execution to prevent concurrent runs
  const claimed = await claimExecution(executionId, expectedStatus);
  if (!claimed) {
    // Another process already claimed it, or status changed
    console.warn(
      `[agent-runner] Could not claim execution ${executionId} (expected ${expectedStatus})`
    );
    return;
  }

  // Set up execution limits
  const maxCostCents = definition.maxCostCents ?? DEFAULT_MAX_COST_CENTS;
  const maxTokens = definition.maxTokens ?? DEFAULT_MAX_TOKENS;
  const timeoutMs = definition.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;

  const input: Record<string, unknown> = execution.input ? JSON.parse(execution.input as string) as Record<string, unknown> : {};
  const previousOutputs: Record<string, unknown>[] = execution.steps
    .filter((s) => s.status === "completed" && s.output)
    .map((s) => JSON.parse(s.output as string) as Record<string, unknown>);

  // Find where to start (first pending step, or first step if fresh)
  const startStep =
    execution.steps.find((s) => s.status === "pending")?.stepNumber ?? 0;

  let totalTokens = execution.totalTokens;
  let totalCostCents = execution.totalCostCents;

  /** Mark execution as failed and notify the client. */
  async function failExecution(error: string) {
    await prisma.agentExecution.update({
      where: { id: executionId },
      data: {
        status: "failed",
        error,
        completedAt: new Date(),
        totalTokens,
        totalCostCents,
      },
    });
    await createNotificationForClient(execClientId, {
      type: "agent",
      title: `Agent "${definition.type}" Failed`,
      message: error.length > 200 ? error.slice(0, 197) + "..." : error,
      actionUrl: "/dashboard/autopilot",
      urgent: true,
    }).catch((err) =>
      console.error("[agent-runner] Failure notification failed:", err instanceof Error ? err.message : err)
    );
  }

  for (let i = startStep; i < definition.steps.length; i++) {
    const stepDef = definition.steps[i];

    // ---- Timeout check ----
    if (Date.now() > deadline) {
      await failExecution(`Execution timed out after ${timeoutMs}ms`);
      return;
    }

    // ---- Per-execution cost / token limit check ----
    if (totalCostCents >= maxCostCents) {
      await failExecution(`Execution cost limit reached (${totalCostCents}c / ${maxCostCents}c max)`);
      return;
    }
    if (totalTokens >= maxTokens) {
      await failExecution(`Execution token limit reached (${totalTokens} / ${maxTokens} max)`);
      return;
    }

    // ---- Governance: approval check ----
    if (stepDef.requiresApproval) {
      const needsApproval = await requiresApproval(
        execution.clientId,
        `agent.${definition.type}.${stepDef.action}`
      );
      if (needsApproval) {
        // Create/find the step record
        let step = execution.steps.find((s) => s.stepNumber === i);
        if (!step) {
          step = await prisma.agentStep.create({
            data: {
              executionId,
              stepNumber: i,
              action: stepDef.action,
              input: JSON.stringify(input),
              status: "pending",
            },
          });
        }

        // Request approval and pause
        await requestApproval(
          execution.clientId,
          `agent.${definition.type}.${stepDef.action}`,
          `Agent "${definition.type}" needs approval for step: ${stepDef.action}`,
          { executionId, stepNumber: i },
          executionId
        );

        await prisma.agentExecution.update({
          where: { id: executionId },
          data: { status: "paused" },
        });
        return; // Paused -- will resume later
      }
    }

    // ---- Governance: per-step budget guard ----
    // Run a budget check before steps that are likely to incur AI costs.
    // We estimate a small cost per step; the actual spend is recorded after.
    const guard = await guardedAICheck({
      clientId: execution.clientId,
      action: `agent.${definition.type}.${stepDef.action}`,
      estimatedCostCents: 5, // conservative per-step estimate
      description: `Agent "${definition.type}" step: ${stepDef.action}`,
    });
    if (!guard.allowed) {
      // If the guard says approval is required (and wasn't caught above),
      // pause. Otherwise treat as a budget block and fail.
      if (guard.approvalRequestId) {
        await prisma.agentExecution.update({
          where: { id: executionId },
          data: { status: "paused" },
        });
        return;
      }
      await failExecution(`Governance blocked step "${stepDef.action}": ${guard.reason}`);
      return;
    }

    // ---- Create / update step record ----
    let stepRecord = execution.steps.find((s) => s.stepNumber === i);
    if (!stepRecord) {
      stepRecord = await prisma.agentStep.create({
        data: {
          executionId,
          stepNumber: i,
          action: stepDef.action,
          input: JSON.stringify(input),
          status: "running",
          startedAt: new Date(),
        },
      });
    } else {
      await prisma.agentStep.update({
        where: { id: stepRecord.id },
        data: { status: "running", startedAt: new Date() },
      });
    }

    // ---- Execute step (with retry support) ----
    const failureStrategy = stepDef.onFailure ?? "abort";
    const maxRetries =
      failureStrategy === "retry"
        ? (stepDef.maxRetries ?? DEFAULT_MAX_RETRIES)
        : 0;
    let attempt = 0;
    let lastError: unknown = null;
    let stepSucceeded = false;

    while (attempt <= maxRetries) {
      try {
        const context: StepContext = {
          clientId: execution.clientId,
          executionId,
          stepNumber: i,
          input,
          previousOutputs,
        };

        const result = await stepDef.execute(context);

        // Update step as completed
        await prisma.agentStep.update({
          where: { id: stepRecord.id },
          data: {
            status: "completed",
            output: JSON.stringify(result.output),
            completedAt: new Date(),
            tokensUsed: result.tokensUsed || 0,
          },
        });

        // Accumulate
        previousOutputs.push(result.output);
        Object.assign(input, result.output); // Merge output into input for next step
        if (result.tokensUsed) {
          totalTokens += result.tokensUsed;
          // Rough 70/30 input/output split for cost estimation
          const stepCost = estimateCost(
            result.tokensUsed * 0.7,
            result.tokensUsed * 0.3
          );
          totalCostCents += stepCost;

          // Record actual spend against the budget tracker
          const spendResult = await recordAISpend(
            execution.clientId,
            stepCost
          );
          if (!spendResult.success) {
            // Budget exhausted mid-execution -- fail gracefully
            await failExecution(`Budget exhausted after step "${stepDef.action}": ${spendResult.reason}`);
            return;
          }
        }

        stepSucceeded = true;
        break; // Step succeeded, exit retry loop
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt <= maxRetries) {
          console.warn(
            `[agent-runner] Step "${stepDef.action}" failed (attempt ${attempt}/${maxRetries + 1}), retrying...`,
            error instanceof Error ? error.message : error
          );
          // Brief backoff before retry
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * attempt, 5000))
          );
        }
      }
    }

    if (!stepSucceeded) {
      const errorMessage =
        lastError instanceof Error ? lastError.message : "Step failed";

      await prisma.agentStep.update({
        where: { id: stepRecord.id },
        data: {
          status: "failed",
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      if (failureStrategy === "skip") {
        // Mark step as skipped and continue to next step
        await prisma.agentStep.update({
          where: { id: stepRecord.id },
          data: { status: "skipped", error: `Skipped after failure: ${errorMessage}` },
        });
        console.warn(
          `[agent-runner] Skipping failed step "${stepDef.action}" in execution ${executionId}`
        );
        continue;
      }

      // Default: abort the entire execution
      await failExecution(errorMessage);
      return;
    }
  }

  // All steps completed
  await prisma.agentExecution.update({
    where: { id: executionId },
    data: {
      status: "completed",
      output: JSON.stringify({ previousOutputs }),
      completedAt: new Date(),
      totalTokens,
      totalCostCents,
    },
  });

  // Notify the client that the agent execution finished
  await createNotificationForClient(execution.clientId, {
    type: "agent",
    title: `Agent "${definition.type}" Completed`,
    message: `Autopilot agent "${definition.type}" finished all ${definition.steps.length} steps successfully.`,
    actionUrl: "/dashboard/autopilot",
  }).catch((err) =>
    console.error("[agent-runner] Notification failed:", err instanceof Error ? err.message : err)
  );
}
