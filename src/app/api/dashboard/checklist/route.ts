import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { z } from "zod";

const checklistSchema = z.object({
  stepKey: z.string().min(1).max(100),
  completed: z.boolean(),
});

const DEFAULT_STEPS = [
  { stepKey: "gbp", label: "Set up Google Business Profile" },
  { stepKey: "chatbot-greeting", label: "Configure chatbot greeting" },
  { stepKey: "business-hours", label: "Set business hours" },
  { stepKey: "first-post", label: "Review first blog post" },
  { stepKey: "logo", label: "Upload business logo" },
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

    return NextResponse.json(
      steps.map((s) => ({
        id: s.id,
        stepKey: s.stepKey,
        label: DEFAULT_STEPS.find((d) => d.stepKey === s.stepKey)?.label || s.stepKey,
        completed: s.completed,
        completedAt: s.completedAt?.toISOString() ?? null,
      }))
    );
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[checklist] GET failed:", error);
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
    console.error("[checklist] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update checklist" },
      { status: 500 }
    );
  }
}
