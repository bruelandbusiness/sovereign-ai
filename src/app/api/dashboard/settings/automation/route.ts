import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const automationSettingsSchema = z.object({
  dailyBudgetCents: z.number().int().min(0).max(10000000).optional(),
  monthlyBudgetCents: z.number().int().min(0).max(100000000).optional(),
  requireContentApproval: z.boolean().optional(),
  requireReviewApproval: z.boolean().optional(),
  requireAdApproval: z.boolean().optional(),
  adBudgetThreshold: z.number().int().min(0).max(10000000).optional(),
});

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const rules = await prisma.governanceRule.findMany({
      where: { clientId, isActive: true },
      take: 100,
    });

    // Reconstruct settings from rules
    const budgetRule = rules.find((r) => r.ruleType === "budget_limit");
    const approvalRule = rules.find((r) => r.ruleType === "approval_required");

    const budgetConfig: Record<string, number> = budgetRule?.config ? JSON.parse(budgetRule.config) : {};
    const approvalConfig: Record<string, unknown> = approvalRule?.config ? JSON.parse(approvalRule.config) : {};
    const approvalActions = (approvalConfig.actions || []) as string[];

    return NextResponse.json({
      settings: {
        dailyBudgetCents: budgetConfig.dailyLimitCents || 5000,
        monthlyBudgetCents: budgetConfig.monthlyLimitCents || 100000,
        requireContentApproval: approvalActions.includes("content.publish"),
        requireReviewApproval: approvalActions.includes("review.respond"),
        requireAdApproval: approvalActions.includes("ad.budget_change"),
        adBudgetThreshold:
          (approvalConfig.adBudgetThreshold as number) || 50,
      },
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[settings/automation] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { clientId } = await requireClient();
    const body = await request.json();

    const parsed = automationSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Upsert budget rule
    const existingBudget = await prisma.governanceRule.findFirst({
      where: { clientId, ruleType: "budget_limit" },
    });

    if (existingBudget) {
      await prisma.governanceRule.update({
        where: { id: existingBudget.id },
        data: {
          config: JSON.stringify({
            dailyLimitCents: data.dailyBudgetCents || 5000,
            monthlyLimitCents: data.monthlyBudgetCents || 100000,
          }),
        },
      });
    } else {
      await prisma.governanceRule.create({
        data: {
          clientId,
          ruleType: "budget_limit",
          scope: "all",
          config: JSON.stringify({
            dailyLimitCents: data.dailyBudgetCents || 5000,
            monthlyLimitCents: data.monthlyBudgetCents || 100000,
          }),
        },
      });
    }

    // Build approval actions list
    const actions: string[] = [];
    if (data.requireContentApproval) actions.push("content.publish");
    if (data.requireReviewApproval) actions.push("review.respond");
    if (data.requireAdApproval) actions.push("ad.budget_change");

    // Upsert approval rule
    const existingApproval = await prisma.governanceRule.findFirst({
      where: { clientId, ruleType: "approval_required" },
    });

    if (existingApproval) {
      await prisma.governanceRule.update({
        where: { id: existingApproval.id },
        data: {
          config: JSON.stringify({
            actions,
            adBudgetThreshold: data.adBudgetThreshold || 50,
          }),
          isActive: actions.length > 0,
        },
      });
    } else if (actions.length > 0) {
      await prisma.governanceRule.create({
        data: {
          clientId,
          ruleType: "approval_required",
          scope: "all",
          config: JSON.stringify({
            actions,
            adBudgetThreshold: data.adBudgetThreshold || 50,
          }),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    logger.errorWithCause("[settings/automation] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to update automation settings" },
      { status: 500 }
    );
  }
}
