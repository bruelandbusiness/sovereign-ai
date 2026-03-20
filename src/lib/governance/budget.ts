import { prisma } from "@/lib/db";
import { createNotificationForClient } from "@/lib/notifications";

/** Threshold at which we warn about approaching budget limits (80%). */
const BUDGET_WARNING_THRESHOLD = 0.8;

/**
 * Advisory check: does the client likely have budget remaining?
 *
 * NOTE: This is a non-atomic read and should only be used for early/fast
 * rejection (e.g., before queuing work). The real enforcement happens in
 * {@link spendBudget}, which uses an atomic UPDATE ... WHERE to prevent
 * concurrent requests from exceeding the budget.
 */
export async function checkBudget(
  clientId: string,
  costCents: number
): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  const now = new Date();

  // Check daily budget
  const dailyTracker = await prisma.budgetTracker.findFirst({
    where: {
      clientId,
      period: "daily",
      periodStart: { lte: now },
      periodEnd: { gte: now },
    },
  });

  if (dailyTracker) {
    const remaining = dailyTracker.limitCents - dailyTracker.spentCents;
    if (costCents > remaining) {
      // Fire-and-forget: notify the client that their daily budget is exceeded
      notifyBudgetExceeded(clientId, "daily", dailyTracker.spentCents, dailyTracker.limitCents);
      return {
        allowed: false,
        remaining,
        reason: "Daily budget limit exceeded",
      };
    }
    // Warn when approaching the daily budget limit
    const usageRatio = dailyTracker.spentCents / dailyTracker.limitCents;
    if (usageRatio >= BUDGET_WARNING_THRESHOLD) {
      notifyBudgetApproaching(clientId, "daily", dailyTracker.spentCents, dailyTracker.limitCents);
    }
  }

  // Check monthly budget
  const monthlyTracker = await prisma.budgetTracker.findFirst({
    where: {
      clientId,
      period: "monthly",
      periodStart: { lte: now },
      periodEnd: { gte: now },
    },
  });

  if (monthlyTracker) {
    const remaining = monthlyTracker.limitCents - monthlyTracker.spentCents;
    if (costCents > remaining) {
      // Fire-and-forget: notify the client that their monthly budget is exceeded
      notifyBudgetExceeded(clientId, "monthly", monthlyTracker.spentCents, monthlyTracker.limitCents);
      return {
        allowed: false,
        remaining,
        reason: "Monthly budget limit exceeded",
      };
    }
    // Warn when approaching the monthly budget limit
    const usageRatio = monthlyTracker.spentCents / monthlyTracker.limitCents;
    if (usageRatio >= BUDGET_WARNING_THRESHOLD) {
      notifyBudgetApproaching(clientId, "monthly", monthlyTracker.spentCents, monthlyTracker.limitCents);
    }
  }

  const minRemaining = Math.min(
    dailyTracker
      ? dailyTracker.limitCents - dailyTracker.spentCents
      : Infinity,
    monthlyTracker
      ? monthlyTracker.limitCents - monthlyTracker.spentCents
      : Infinity
  );

  return {
    allowed: true,
    remaining: minRemaining === Infinity ? -1 : minRemaining,
  };
}

// ---------------------------------------------------------------------------
// Budget notification helpers (fire-and-forget)
// ---------------------------------------------------------------------------

function notifyBudgetApproaching(
  clientId: string,
  period: string,
  spentCents: number,
  limitCents: number,
) {
  const pct = Math.round((spentCents / limitCents) * 100);
  createNotificationForClient(clientId, {
    type: "billing",
    title: `${capitalize(period)} Budget ${pct}% Used`,
    message: `You have used $${(spentCents / 100).toFixed(2)} of your $${(limitCents / 100).toFixed(2)} ${period} AI budget. Adjust your limits in automation settings.`,
    actionUrl: "/dashboard/settings/automation",
    urgent: false,
  }).catch((err) =>
    console.error("[budget] Failed to send approaching notification:", err instanceof Error ? err.message : err)
  );
}

function notifyBudgetExceeded(
  clientId: string,
  period: string,
  spentCents: number,
  limitCents: number,
) {
  createNotificationForClient(clientId, {
    type: "billing",
    title: `${capitalize(period)} Budget Limit Reached`,
    message: `Your ${period} AI budget of $${(limitCents / 100).toFixed(2)} has been exhausted ($${(spentCents / 100).toFixed(2)} spent). AI actions are paused until the next period or limit increase.`,
    actionUrl: "/dashboard/settings/automation",
    urgent: true,
  }).catch((err) =>
    console.error("[budget] Failed to send exceeded notification:", err instanceof Error ? err.message : err)
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Atomically record spend against budget trackers.
 *
 * Wraps the daily and monthly updates in a database transaction so that
 * either both succeed or neither does. Each individual UPDATE uses a
 * WHERE guard (`spentCents + costCents <= limitCents`) to prevent
 * concurrent requests from exceeding the budget.
 *
 * @returns `{ success: true }` if all active trackers had sufficient
 *          budget and were updated, or `{ success: false, reason }` if
 *          any tracker would be exceeded (no spend is recorded in that case).
 */
export async function spendBudget(
  clientId: string,
  costCents: number
): Promise<{ success: boolean; reason?: string }> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    // Atomically update daily tracker — only if the budget is not exceeded
    const dailyResult: number = await tx.$executeRaw`
      UPDATE "BudgetTracker"
      SET "spentCents" = "spentCents" + ${costCents}
      WHERE "clientId" = ${clientId}
        AND "period" = 'daily'
        AND "periodStart" <= ${now}
        AND "periodEnd" >= ${now}
        AND ("spentCents" + ${costCents}) <= "limitCents"
    `;

    // Check if a daily tracker exists but wasn't updated (budget exceeded)
    const dailyTracker = await tx.budgetTracker.findFirst({
      where: {
        clientId,
        period: "daily",
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
    });

    if (dailyTracker && dailyResult === 0) {
      // Transaction will be rolled back automatically on throw
      throw new BudgetExceededError("Daily budget limit exceeded");
    }

    // Atomically update monthly tracker — only if the budget is not exceeded
    const monthlyResult: number = await tx.$executeRaw`
      UPDATE "BudgetTracker"
      SET "spentCents" = "spentCents" + ${costCents}
      WHERE "clientId" = ${clientId}
        AND "period" = 'monthly'
        AND "periodStart" <= ${now}
        AND "periodEnd" >= ${now}
        AND ("spentCents" + ${costCents}) <= "limitCents"
    `;

    // Check if a monthly tracker exists but wasn't updated (budget exceeded)
    const monthlyTracker = await tx.budgetTracker.findFirst({
      where: {
        clientId,
        period: "monthly",
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
    });

    if (monthlyTracker && monthlyResult === 0) {
      // Transaction will be rolled back automatically (daily spend included)
      throw new BudgetExceededError("Monthly budget limit exceeded");
    }

    return { success: true as const };
  }).catch((err) => {
    if (err instanceof BudgetExceededError) {
      return { success: false as const, reason: err.message };
    }
    throw err; // Re-throw unexpected errors
  });
}

/** Sentinel error used to trigger a transaction rollback for budget limits. */
class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}
