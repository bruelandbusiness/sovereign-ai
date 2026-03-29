import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { z } from "zod";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const checklistSchema = z.object({
  stepKey: z.string().min(1).max(100),
  completed: z.boolean(),
});

const DEFAULT_STEPS = [
  { stepKey: "complete-profile", label: "Complete your profile" },
  { stepKey: "connect-google", label: "Connect Google Business" },
  { stepKey: "activate-service", label: "Activate your first service" },
  { stepKey: "review-chatbot", label: "Review AI chatbot" },
  { stepKey: "setup-notifications", label: "Set up notifications" },
];

export async function GET() {
  try {
    const { clientId } = await requireClient();

    // Ensure all default steps exist
    const existing = await prisma.onboardingStep.findMany({
      where: { clientId },
      take: 50,
    });
    const existingKeys = new Set(existing.map((s) => s.stepKey));

    const toCreate = DEFAULT_STEPS.filter((s) => !existingKeys.has(s.stepKey));
    if (toCreate.length > 0) {
      await prisma.onboardingStep.createMany({
        data: toCreate.map((s) => ({ clientId, stepKey: s.stepKey })),
      });
    }

    const steps = await prisma.onboardingStep.findMany({
      where: { clientId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    const response = NextResponse.json(
      steps.map((s) => ({
        id: s.id,
        stepKey: s.stepKey,
        label: DEFAULT_STEPS.find((d) => d.stepKey === s.stepKey)?.label || s.stepKey,
        completed: s.completed,
        completedAt: s.completedAt?.toISOString() ?? null,
      }))
    );
    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=30");
    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    Sentry.captureException(error);
    logger.errorWithCause("[checklist] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { clientId } = await requireClient();

    const body = await request.json();
    const parsed = checklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { stepKey, completed } = parsed.data;

    const step = await prisma.onboardingStep.upsert({
      where: { clientId_stepKey: { clientId, stepKey } },
      create: {
        clientId,
        stepKey,
        completed: !!completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed: !!completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({
      id: step.id,
      stepKey: step.stepKey,
      completed: step.completed,
      completedAt: step.completedAt?.toISOString() ?? null,
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    Sentry.captureException(error);
    logger.errorWithCause("[checklist] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update checklist" },
      { status: 500 }
    );
  }
}
