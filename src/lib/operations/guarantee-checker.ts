/**
 * Guarantee Checker — enforces the lead delivery guarantee from SERVICES.md.
 *
 * Runs monthly (1st of month). For each active client:
 *   1. Determines their tier from Subscription.bundleId
 *   2. Counts leads delivered in the previous calendar month
 *   3. Compares against contracted volume (tier default or PerformancePlan override)
 *   4. Issues credits and alerts per the guarantee schedule:
 *      - ≥80%: guarantee met, no action
 *      - 50–79%: pro-rated credit + root cause flag
 *      - <50%: full month credit + client exit-eligible alert
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendTelegramAlert } from "@/lib/telegram";
import {
  bundleToTier,
  checkGuarantee,
  formatGuaranteeStatus,
  type GuaranteeCheck,
} from "@/lib/service-tiers";

const TAG = "[operations/guarantee-checker]";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns { start, end, label } for the previous calendar month. */
function previousMonth(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  return { start, end, label };
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export interface GuaranteeRunResult {
  processed: number;
  met: number;
  credited: number;
  fullCredited: number;
  totalCreditCents: number;
}

export async function runGuaranteeCheck(): Promise<GuaranteeRunResult> {
  const { start, end, label } = previousMonth();
  logger.info(`${TAG} Running guarantee check for ${label}`);

  const clients = await prisma.client.findMany({
    where: { subscription: { status: "active" } },
    select: {
      id: true,
      businessName: true,
      subscription: { select: { bundleId: true, monthlyAmount: true } },
      performancePlan: { select: { currentLeadCount: true } },
    },
  });

  const result: GuaranteeRunResult = {
    processed: 0,
    met: 0,
    credited: 0,
    fullCredited: 0,
    totalCreditCents: 0,
  };

  for (const client of clients) {
    try {
      const tierId = bundleToTier(client.subscription?.bundleId ?? null);
      if (!tierId) {
        // No mappable tier (e.g., DIY plan or missing bundleId) — skip
        continue;
      }

      // Count leads delivered in the previous month
      const deliveredLeads = await prisma.lead.count({
        where: {
          clientId: client.id,
          createdAt: { gte: start, lt: end },
        },
      });

      // Use PerformancePlan target if set, otherwise tier default
      const customTarget = client.performancePlan?.currentLeadCount
        ? undefined // let tier default apply — currentLeadCount is a running counter, not a target
        : undefined;

      const check: GuaranteeCheck = checkGuarantee(
        client.id,
        tierId,
        label,
        deliveredLeads,
        customTarget,
      );

      // Persist result as an activity event for audit trail
      await prisma.activityEvent.create({
        data: {
          clientId: client.id,
          type: "guarantee_check",
          title: `Guarantee Check: ${label}`,
          description: formatGuaranteeStatus(check),
          metadata: JSON.stringify(check),
        },
      });

      // Handle outcomes
      if (check.status === "met") {
        result.met++;
      } else if (check.status === "credit") {
        result.credited++;
        result.totalCreditCents += check.creditAmount;

        // Create credit invoice (negative amount)
        await prisma.invoice.create({
          data: {
            clientId: client.id,
            customerName: client.businessName ?? "Client",
            description: `Lead delivery credit for ${label}: ${check.deliveredLeads}/${check.contractedLeads} delivered (${check.deliveryPercent}%)`,
            amount: -check.creditAmount,
            status: "draft",
          },
        });

        await sendTelegramAlert(
          "warning",
          "Lead Delivery Shortfall",
          `Client "${client.businessName}" (${client.id})\n${formatGuaranteeStatus(check)}\n\nCredit invoice created. Root cause analysis needed.`,
        );
      } else if (check.status === "full_credit") {
        result.fullCredited++;
        result.totalCreditCents += check.creditAmount;

        await prisma.invoice.create({
          data: {
            clientId: client.id,
            customerName: client.businessName ?? "Client",
            description: `FULL MONTH credit for ${label}: ${check.deliveredLeads}/${check.contractedLeads} delivered (${check.deliveryPercent}%). Client exit-eligible.`,
            amount: -check.creditAmount,
            status: "draft",
          },
        });

        await sendTelegramAlert(
          "critical",
          "Guarantee Breach — Client Exit-Eligible",
          `Client "${client.businessName}" (${client.id})\n${formatGuaranteeStatus(check)}\n\nFull month credit issued. Client is eligible to exit contract. IMMEDIATE ACTION REQUIRED.`,
        );
      }

      result.processed++;
    } catch (err) {
      logger.errorWithCause(`${TAG} Failed for client`, err, {
        clientId: client.id,
      });
    }
  }

  // Summary alert
  if (result.credited > 0 || result.fullCredited > 0) {
    await sendTelegramAlert(
      "report",
      `Guarantee Check Summary — ${label}`,
      `Processed: ${result.processed}\nMet: ${result.met}\nPro-rated credit: ${result.credited}\nFull credit: ${result.fullCredited}\nTotal credits: $${(result.totalCreditCents / 100).toFixed(2)}`,
    );
  } else {
    logger.info(`${TAG} All ${result.processed} clients met their guarantee for ${label}`);
  }

  return result;
}
