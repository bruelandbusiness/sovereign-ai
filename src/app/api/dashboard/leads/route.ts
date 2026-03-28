import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const leads = await prisma.lead.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        createdAt: true,
        status: true,
        score: true,
      },
    });

    const mapped = leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source,
      date: lead.createdAt.toISOString(),
      status: lead.status,
      score: lead.score,
    }));

    const response = apiSuccess(mapped);
    response.headers.set(
      "Cache-Control",
      "private, max-age=15, stale-while-revalidate=10",
    );

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    logger.errorWithCause("[leads] GET failed:", error);
    return apiError("Failed to fetch leads", 500);
  }
}
