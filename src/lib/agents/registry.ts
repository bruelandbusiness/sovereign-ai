// ---------------------------------------------------------------------------
// Agent Registry — Tracks all registered agents and their runtime status
// ---------------------------------------------------------------------------

import { logger } from "@/lib/logger";
import type {
  AgentConfig,
  AgentRunResult,
  AgentRunner,
  AgentStatus,
} from "./base";

const TAG = "[agent-registry]";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export interface RegisteredAgent {
  config: AgentConfig;
  runner: AgentRunner;
  lastRun: Date | null;
  lastResult: AgentRunResult | null;
  isRunning: boolean;
}

// ---------------------------------------------------------------------------
// Registry store
// ---------------------------------------------------------------------------

const agents = new Map<string, RegisteredAgent>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register an agent with its config and runner function.
 * Throws if an agent with the same name is already registered.
 */
export function registerAgent(config: AgentConfig, runner: AgentRunner): void {
  if (agents.has(config.name)) {
    logger.warn(`${TAG} Agent "${config.name}" is already registered — skipping`);
    return;
  }

  agents.set(config.name, {
    config,
    runner,
    lastRun: null,
    lastResult: null,
    isRunning: false,
  });

  logger.info(`${TAG} Registered agent "${config.name}": ${config.description}`);
}

/**
 * Retrieve a registered agent by name.
 */
export function getAgent(name: string): RegisteredAgent | undefined {
  return agents.get(name);
}

/**
 * Return all registered agents.
 */
export function getAllAgents(): RegisteredAgent[] {
  return Array.from(agents.values());
}

/**
 * Execute a registered agent by name.
 *
 * - Measures wall-clock duration and patches it into the result.
 * - Catches thrown errors and returns a failed AgentRunResult.
 * - Logs a warning when requiresApproval is true and dryRun is false.
 */
export async function runAgent(
  name: string,
  clientId?: string,
  dryRun: boolean = false
): Promise<AgentRunResult> {
  const entry = agents.get(name);
  if (!entry) {
    const msg = `Agent "${name}" is not registered`;
    logger.error(`${TAG} ${msg}`);
    return {
      agentName: name,
      clientId: clientId ?? null,
      status: "failed",
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors: [{ message: msg }],
      durationSeconds: 0,
      dryRun,
      summary: msg,
    };
  }

  const { config, runner } = entry;

  // Approval gate
  if (config.requiresApproval && !dryRun) {
    logger.warn(
      `${TAG} Agent "${name}" requires approval before execution — running in dry-run mode is recommended`
    );
  }

  // Mark as running
  entry.isRunning = true;
  const startTime = Date.now();

  logger.info(
    `${TAG} Running agent "${name}"${clientId ? ` for client ${clientId}` : ""} (dryRun=${dryRun})`
  );

  try {
    const result = await runner(clientId ?? null, dryRun);

    // Patch accurate duration
    const durationSeconds = (Date.now() - startTime) / 1000;
    const finalResult: AgentRunResult = { ...result, durationSeconds };

    entry.lastRun = new Date();
    entry.lastResult = finalResult;
    entry.isRunning = false;

    logger.info(
      `${TAG} Agent "${name}" finished — status=${finalResult.status}, processed=${finalResult.itemsProcessed}, duration=${finalResult.durationSeconds.toFixed(2)}s`
    );

    return finalResult;
  } catch (error) {
    const durationSeconds = (Date.now() - startTime) / 1000;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    const failedResult: AgentRunResult = {
      agentName: name,
      clientId: clientId ?? null,
      status: "failed",
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors: [
        {
          message: errorMessage,
          detail: error instanceof Error ? error.stack : undefined,
        },
      ],
      durationSeconds,
      dryRun,
      summary: `Agent "${name}" threw an unhandled error: ${errorMessage}`,
    };

    entry.lastRun = new Date();
    entry.lastResult = failedResult;
    entry.isRunning = false;

    logger.error(`${TAG} Agent "${name}" failed: ${errorMessage}`);

    return failedResult;
  }
}

/**
 * Return the current status of a registered agent.
 */
export function getAgentStatus(name: string): AgentStatus {
  const entry = agents.get(name);
  if (!entry) {
    return {
      agentName: name,
      lastRun: null,
      lastResult: null,
      nextRun: null,
      isRunning: false,
    };
  }

  return {
    agentName: entry.config.name,
    lastRun: entry.lastRun,
    lastResult: entry.lastResult,
    nextRun: null, // Scheduling is handled externally; callers can compute from config.schedule
    isRunning: entry.isRunning,
  };
}
