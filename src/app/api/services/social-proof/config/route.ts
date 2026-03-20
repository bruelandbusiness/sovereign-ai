import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

// Default social proof config
const DEFAULT_CONFIG = {
  enabled: true,
  style: "toast",
  position: "bottom-left",
  frequency: 20000,
  showBookings: true,
  showReviews: true,
  showLeads: true,
  maxPerVisit: 5,
};

// GET: Fetch social proof widget config
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const service = await prisma.clientService.findFirst({
      where: { clientId, serviceId: "social-proof" },
    });

    let config = { ...DEFAULT_CONFIG };
    if (service?.config) {
      try {
        const parsed = JSON.parse(service.config) as Partial<typeof DEFAULT_CONFIG>;
        config = { ...DEFAULT_CONFIG, ...parsed };
      } catch {
        // use defaults
      }
    }

    return NextResponse.json({ config, clientId });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[social-proof/config] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch social proof config" },
      { status: 500 }
    );
  }
}

// PATCH: Update social proof widget config
const configSchema = z.object({
  enabled: z.boolean().optional(),
  style: z.enum(["minimal", "card", "toast"]).optional(),
  position: z
    .enum(["bottom-left", "bottom-right", "top-left", "top-right"])
    .optional(),
  frequency: z.number().min(5000).max(120000).optional(),
  showBookings: z.boolean().optional(),
  showReviews: z.boolean().optional(),
  showLeads: z.boolean().optional(),
  maxPerVisit: z.number().min(1).max(20).optional(),
});

export async function PATCH(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, configSchema);
    if (!validation.success) {
      return validation.response;
    }

    // Merge with existing config
    const service = await prisma.clientService.findFirst({
      where: { clientId, serviceId: "social-proof" },
    });

    let existingConfig = { ...DEFAULT_CONFIG };
    if (service?.config) {
      try {
        const parsed = JSON.parse(service.config) as Partial<typeof DEFAULT_CONFIG>;
        existingConfig = { ...DEFAULT_CONFIG, ...parsed };
      } catch {
        // use defaults
      }
    }

    const newConfig = { ...existingConfig, ...validation.data };

    if (service) {
      await prisma.clientService.update({
        where: { id: service.id },
        data: { config: JSON.stringify(newConfig) },
      });
    } else {
      await prisma.clientService.create({
        data: {
          clientId,
          serviceId: "social-proof",
          status: "active",
          config: JSON.stringify(newConfig),
        },
      });
    }

    return NextResponse.json({ config: newConfig });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[social-proof/config] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update social proof config" },
      { status: 500 }
    );
  }
}
