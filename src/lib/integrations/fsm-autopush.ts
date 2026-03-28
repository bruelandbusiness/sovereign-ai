// FSM auto-push helper
// Called non-blocking when leads or bookings are created.
// Pushes to all active FSM connections for the client and logs results.

import { prisma } from "@/lib/db";
import { pushLeadToFSM, pushBookingToFSM } from "@/lib/integrations/fsm";
import type { FSMPlatform } from "@/lib/integrations/fsm";

import { logger } from "@/lib/logger";
/**
 * Push a newly created lead to all active FSM connections for the client.
 * Runs fire-and-forget — errors are logged but don't propagate.
 */
export async function autoPushLeadToFSM(
  clientId: string,
  lead: { id: string; name: string; email?: string | null; phone?: string | null; notes?: string | null }
): Promise<void> {
  try {
    const connections = await prisma.fSMConnection.findMany({
      where: { clientId, isActive: true },
    });

    if (connections.length === 0) return;

    for (const connection of connections) {
      try {
        const result = await pushLeadToFSM(
          connection.platform as FSMPlatform,
          {
            name: lead.name,
            email: lead.email || undefined,
            phone: lead.phone || undefined,
            notes: lead.notes || undefined,
          },
          connection.accessToken || undefined
        );

        await prisma.fSMSyncLog.create({
          data: {
            connectionId: connection.id,
            direction: "outbound",
            entityType: "customer",
            entityId: lead.id,
            externalId: result.externalId || null,
            action: "created",
            status: result.success ? "success" : "error",
            details: result.success
              ? `Pushed lead "${lead.name}" to ${connection.platform}${result.isMock ? " (mock)" : ""}`
              : `Failed to push lead: ${result.error}`,
          },
        });
      } catch (err) {
        logger.errorWithCause(
          `[fsm-autopush] Error pushing lead to ${connection.platform}`,
          err
        );

        await prisma.fSMSyncLog.create({
          data: {
            connectionId: connection.id,
            direction: "outbound",
            entityType: "customer",
            entityId: lead.id,
            action: "created",
            status: "error",
            details: `Exception: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        }).catch((err) => logger.errorWithCause("[fsm] Lead sync log write failed:", err instanceof Error ? err.message : err));
      }
    }
  } catch (err) {
    logger.errorWithCause("[fsm-autopush] Error querying FSM connections:", err);
  }
}

/**
 * Push a newly created booking to all active FSM connections for the client.
 * Runs fire-and-forget — errors are logged but don't propagate.
 */
export async function autoPushBookingToFSM(
  clientId: string,
  booking: {
    id: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    scheduledAt: string;
    description?: string | null;
  }
): Promise<void> {
  try {
    const connections = await prisma.fSMConnection.findMany({
      where: { clientId, isActive: true },
    });

    if (connections.length === 0) return;

    for (const connection of connections) {
      try {
        const result = await pushBookingToFSM(
          connection.platform as FSMPlatform,
          {
            customerName: booking.customerName,
            customerEmail: booking.customerEmail || undefined,
            customerPhone: booking.customerPhone || undefined,
            scheduledAt: booking.scheduledAt,
            description: booking.description || undefined,
          },
          connection.accessToken || undefined
        );

        await prisma.fSMSyncLog.create({
          data: {
            connectionId: connection.id,
            direction: "outbound",
            entityType: "booking",
            entityId: booking.id,
            externalId: result.externalId || null,
            action: "created",
            status: result.success ? "success" : "error",
            details: result.success
              ? `Pushed booking for "${booking.customerName}" to ${connection.platform}${result.isMock ? " (mock)" : ""}`
              : `Failed to push booking: ${result.error}`,
          },
        });
      } catch (err) {
        logger.errorWithCause(
          `[fsm-autopush] Error pushing booking to ${connection.platform}`,
          err
        );

        await prisma.fSMSyncLog.create({
          data: {
            connectionId: connection.id,
            direction: "outbound",
            entityType: "booking",
            entityId: booking.id,
            action: "created",
            status: "error",
            details: `Exception: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        }).catch((err) => logger.errorWithCause("[fsm] Booking sync log write failed:", err instanceof Error ? err.message : err));
      }
    }
  } catch (err) {
    logger.errorWithCause("[fsm-autopush] Error querying FSM connections:", err);
  }
}
