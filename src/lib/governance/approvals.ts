import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Check if an action requires approval based on governance rules.
 */
export async function requiresApproval(
  clientId: string,
  actionType: string
): Promise<boolean> {
  const rule = await prisma.governanceRule.findFirst({
    where: {
      clientId,
      ruleType: "approval_required",
      isActive: true,
      OR: [{ scope: "all" }, { scope: actionType.split(".")[0] }],
    },
  });

  if (!rule) return false;

  const config: { actions?: string[] } = rule.config ? JSON.parse(rule.config) : {};
  if (!config.actions) return true;
  return config.actions.includes(actionType);
}

/**
 * Create an approval request.
 */
export async function requestApproval(
  clientId: string,
  actionType: string,
  description: string,
  payload: unknown,
  agentExecutionId?: string
): Promise<{ id: string }> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const request = await prisma.approvalRequest.create({
    data: {
      clientId,
      agentExecutionId,
      actionType,
      description,
      payload: payload != null ? JSON.stringify(payload) : null,
      status: "pending",
      expiresAt,
    },
  });

  // Create notification for client
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { accountId: true },
  });

  if (client) {
    try {
      await prisma.notification.create({
        data: {
          accountId: client.accountId,
          type: "approval_required",
          title: "Action Requires Approval",
          message: description,
          actionUrl: "/dashboard/autopilot",
        },
      });
    } catch (err) {
      logger.errorWithCause("[governance] Failed to send approval notification", err);
    }
  }

  return { id: request.id };
}

/**
 * Process an approval decision.
 *
 * Validates that the request is still pending and has not expired before
 * allowing the decision to take effect. Throws if the request is in an
 * invalid state (already decided, expired, or not found).
 */
export async function processApproval(
  requestId: string,
  decision: "approved" | "rejected",
  reviewerId: string
): Promise<void> {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Approval request not found");
  }

  if (request.status !== "pending") {
    throw new Error(
      `Cannot ${decision} request — current status is "${request.status}"`
    );
  }

  if (request.expiresAt && request.expiresAt < new Date()) {
    // Expire it on the spot so the cron doesn't have to
    await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: "expired" },
    });
    throw new Error("Approval request has expired");
  }

  await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: decision,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    },
  });
}

/**
 * Expire stale approval requests.
 */
export async function expireStaleApprovals(): Promise<number> {
  const result = await prisma.approvalRequest.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
  return result.count;
}
