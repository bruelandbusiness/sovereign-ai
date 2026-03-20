import Anthropic from "@anthropic-ai/sdk";
import type { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/messages";
import { checkBudget, spendBudget } from "./budget";
import { requiresApproval, requestApproval } from "./approvals";

interface AIGuardOptions {
  clientId: string;
  action: string; // e.g., "chatbot.response", "content.generate"
  estimatedCostCents: number;
  description?: string;
}

interface AIGuardResult {
  allowed: boolean;
  reason?: string;
  approvalRequestId?: string;
}

/** Thrown when budget or approval rules prevent an AI call. */
export class GovernanceBlockedError extends Error {
  public readonly reason: string;
  public readonly approvalRequestId?: string;

  constructor(reason: string, approvalRequestId?: string) {
    super(`AI call blocked: ${reason}`);
    this.name = "GovernanceBlockedError";
    this.reason = reason;
    this.approvalRequestId = approvalRequestId;
  }
}

/**
 * Check if an AI action is allowed under governance rules.
 * Call this BEFORE making an Anthropic SDK call.
 */
export async function guardedAICheck(
  options: AIGuardOptions
): Promise<AIGuardResult> {
  const { clientId, action, estimatedCostCents, description } = options;

  // 1. Check budget
  const budget = await checkBudget(clientId, estimatedCostCents);
  if (!budget.allowed) {
    return { allowed: false, reason: budget.reason };
  }

  // 2. Check if approval is required
  const needsApproval = await requiresApproval(clientId, action);
  if (needsApproval) {
    const approval = await requestApproval(
      clientId,
      action,
      description || `AI action: ${action}`,
      { estimatedCostCents }
    );
    return {
      allowed: false,
      reason: "Approval required",
      approvalRequestId: approval.id,
    };
  }

  return { allowed: true };
}

/**
 * Record AI spend after a successful call.
 * Call this AFTER a successful Anthropic SDK call.
 *
 * Uses the atomic spendBudget() which enforces the budget limit at the
 * database level to prevent race conditions.
 *
 * @returns `{ success: true }` if spend was recorded, or
 *          `{ success: false, reason }` if the budget would be exceeded.
 */
export async function recordAISpend(
  clientId: string,
  costCents: number
): Promise<{ success: boolean; reason?: string }> {
  return spendBudget(clientId, costCents);
}

/**
 * Estimate cost in cents for a given token count.
 * Based on Claude Haiku pricing: $0.25/MTok input, $1.25/MTok output
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * 25; // cents
  const outputCost = (outputTokens / 1_000_000) * 125; // cents
  return Math.ceil(inputCost + outputCost);
}

// ---------------------------------------------------------------------------
// Shared Anthropic SDK instance (lazy singleton)
// ---------------------------------------------------------------------------
let _anthropicInstance: Anthropic | null = null;

/**
 * Returns the shared Anthropic SDK client.
 * Throws a descriptive error if ANTHROPIC_API_KEY is not configured,
 * preventing cryptic 401 failures downstream.
 */
function getAnthropicClient(): Anthropic {
  if (!_anthropicInstance) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. AI features are unavailable."
      );
    }
    _anthropicInstance = new Anthropic({ timeout: 30000 });
  }
  return _anthropicInstance;
}

// ---------------------------------------------------------------------------
// guardedAnthropicCall — one-stop wrapper for AI calls with governance
// ---------------------------------------------------------------------------

interface GuardedCallOptions {
  /** The client whose budget/approval rules should be checked. */
  clientId: string;
  /** Governance action label, e.g. "chatbot.response". */
  action: string;
  /** Anthropic messages.create params (non-streaming). */
  params: MessageCreateParamsNonStreaming;
  /** Optional human-readable description for approval requests. */
  description?: string;
}

/**
 * All-in-one helper: runs governance pre-check, makes the Anthropic API
 * call, records actual spend, and returns the response.
 *
 * Throws {@link GovernanceBlockedError} if budget or approval rules
 * prevent the call. All other exceptions propagate normally.
 *
 * Routes that previously called `anthropic.messages.create(...)` directly
 * should switch to this function to ensure budget enforcement.
 */
export async function guardedAnthropicCall(
  options: GuardedCallOptions
): Promise<Anthropic.Message> {
  const { clientId, action, params, description } = options;

  // Estimate cost from max_tokens (worst case)
  const estimatedInputTokens = 500; // Reasonable default for a prompt
  const estimatedOutputTokens = params.max_tokens ?? 1024;
  const estimatedCents = estimateCost(estimatedInputTokens, estimatedOutputTokens);

  // Pre-flight governance check (budget + approval)
  const guard = await guardedAICheck({
    clientId,
    action,
    estimatedCostCents: estimatedCents,
    description,
  });

  if (!guard.allowed) {
    throw new GovernanceBlockedError(
      guard.reason || "Governance check failed",
      guard.approvalRequestId
    );
  }

  // Make the actual API call
  const client = getAnthropicClient();
  const response = await client.messages.create(params);

  // Record actual spend
  const actualCost = estimateCost(
    response.usage?.input_tokens ?? estimatedInputTokens,
    response.usage?.output_tokens ?? estimatedOutputTokens
  );
  const spendResult = await recordAISpend(clientId, actualCost);
  if (!spendResult.success) {
    // The call already happened so we can't un-do it, but we log the
    // overage so dashboards / alerts can pick it up.
    console.warn(
      `[ai-guard] Budget overage for client ${clientId}: ${spendResult.reason}`
    );
  }

  return response;
}
