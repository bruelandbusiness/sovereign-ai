// ---------------------------------------------------------------------------
// AgentBase — Standardized agent contract
// ---------------------------------------------------------------------------
// Every agent in the system implements this contract. The interfaces define
// the shape of run results, runtime status, and static configuration.
// ---------------------------------------------------------------------------

/**
 * The result returned after an agent completes (or fails) a run.
 */
export interface AgentRunResult {
  agentName: string;
  clientId: string | null;
  status: "completed" | "partial" | "failed";
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errors: Array<{ message: string; detail?: string }>;
  durationSeconds: number;
  dryRun: boolean;
  /** One-line human-readable result. */
  summary: string;
}

/**
 * Live status snapshot for a registered agent.
 */
export interface AgentStatus {
  agentName: string;
  lastRun: Date | null;
  lastResult: AgentRunResult | null;
  nextRun: Date | null;
  isRunning: boolean;
}

/**
 * Static configuration that describes an agent's identity and scheduling.
 */
export interface AgentConfig {
  /** Unique identifier (e.g., "delivery.discovery"). */
  name: string;
  /** One-line purpose. */
  description: string;
  /** Cron expression (or descriptive string for non-cron schedules). */
  schedule: string;
  /** True = runs per client, False = runs globally. */
  clientScoped: boolean;
  /** True = queues output for /approve before executing. */
  requiresApproval: boolean;
}

/**
 * The function signature every agent runner must satisfy.
 */
export type AgentRunner = (
  clientId: string | null,
  dryRun: boolean
) => Promise<AgentRunResult>;
