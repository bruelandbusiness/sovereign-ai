import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { validateBody } from "@/lib/validate";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const updateTextbackConfigSchema = z.object({
  enabled: z.boolean().optional(),
  message: z.string().min(1).max(500).optional(),
});

// ---------------------------------------------------------------------------
// GET — Retrieve the client's missed-call text-back configuration
// ---------------------------------------------------------------------------

export async function GET() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const service = await prisma.clientService.findUnique({
    where: {
      clientId_serviceId: {
        clientId,
        serviceId: "voice",
      },
    },
  });

  let textbackEnabled = true;
  let textbackMessage =
    "Sorry we missed your call! Reply to this text and we'll get back to you ASAP. - {businessName}";

  if (service?.config) {
    try {
      const config = JSON.parse(service.config) as {
        textbackEnabled?: boolean;
        textbackMessage?: string;
      };
      if (typeof config.textbackEnabled === "boolean") {
        textbackEnabled = config.textbackEnabled;
      }
      if (config.textbackMessage) {
        textbackMessage = config.textbackMessage;
      }
    } catch {
      // Use defaults
    }
  }

  // Fetch recent textbacks
  const recentTextbacks = await prisma.missedCallTextback.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    enabled: textbackEnabled,
    message: textbackMessage,
    recentTextbacks: recentTextbacks.map((t) => ({
      id: t.id,
      callerPhone: t.callerPhone,
      textSent: t.textSent,
      textMessage: t.textMessage,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

// ---------------------------------------------------------------------------
// PATCH — Update the client's missed-call text-back configuration
// ---------------------------------------------------------------------------

export async function PATCH(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, updateTextbackConfigSchema);
    if (!validation.success) return validation.response;

    const { enabled, message } = validation.data;

    // Get the existing service config
    const service = await prisma.clientService.findUnique({
      where: {
        clientId_serviceId: {
          clientId,
          serviceId: "voice",
        },
      },
    });

    let existingConfig: Record<string, unknown> = {};
    if (service?.config) {
      try {
        existingConfig = JSON.parse(service.config) as Record<string, unknown>;
      } catch {
        existingConfig = {};
      }
    }

    // Update the textback fields
    if (typeof enabled === "boolean") {
      existingConfig.textbackEnabled = enabled;
    }
    if (typeof message === "string" && message.trim()) {
      existingConfig.textbackMessage = message.trim();
    }

    const configJson = JSON.stringify(existingConfig);

    if (service) {
      await prisma.clientService.update({
        where: { id: service.id },
        data: { config: configJson },
      });
    } else {
      // Create the voice service record with this config
      await prisma.clientService.create({
        data: {
          clientId,
          serviceId: "voice",
          status: "active",
          config: configJson,
        },
      });
    }

    return NextResponse.json({
      enabled: existingConfig.textbackEnabled ?? true,
      message:
        existingConfig.textbackMessage ??
        "Sorry we missed your call! Reply to this text and we'll get back to you ASAP. - {businessName}",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[voice/textback-config] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update textback config" },
      { status: 500 }
    );
  }
}
