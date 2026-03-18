import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_STEPS = [
  { stepKey: "gbp", label: "Set up Google Business Profile" },
  { stepKey: "chatbot-greeting", label: "Configure chatbot greeting" },
  { stepKey: "business-hours", label: "Set business hours" },
  { stepKey: "first-post", label: "Review first blog post" },
  { stepKey: "logo", label: "Upload business logo" },
];

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clientId = session.account.client.id;

  // Ensure all default steps exist
  const existing = await prisma.onboardingStep.findMany({
    where: { clientId },
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
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clientId = session.account.client.id;

  const body = await request.json();
  const { stepKey, completed } = body as { stepKey: string; completed: boolean };

  if (!stepKey) {
    return NextResponse.json({ error: "stepKey required" }, { status: 400 });
  }

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
}
