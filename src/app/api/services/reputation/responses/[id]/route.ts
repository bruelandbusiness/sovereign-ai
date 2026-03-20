import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

// PATCH: Update status (approve, publish, reject) or edit response text
const updateSchema = z.object({
  status: z.enum(["draft", "approved", "published", "rejected"]).optional(),
  responseText: z.string().min(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { clientId } = await requireClient();
    const { id } = await params;

    const validation = await validateBody(request, updateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const body = validation.data;

    // Verify ownership
    const existing = await prisma.reviewResponse.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Review response not found" },
        { status: 404 }
      );
    }

    // Enforce valid status transitions to prevent skipping human approval.
    // Valid transitions:
    //   draft    -> approved | rejected
    //   approved -> published | rejected | draft (un-approve to re-edit)
    //   rejected -> draft (re-open for editing)
    //   published -> (terminal, no transitions allowed)
    const validTransitions: Record<string, string[]> = {
      draft: ["approved", "rejected"],
      approved: ["published", "rejected", "draft"],
      rejected: ["draft"],
      published: [],
    };

    const updateData: Record<string, unknown> = {};
    if (body.status) {
      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from "${existing.status}" to "${body.status}". Allowed transitions: ${allowed.length > 0 ? allowed.join(", ") : "none (terminal state)"}`,
          },
          { status: 400 }
        );
      }

      updateData.status = body.status;
      if (body.status === "published") {
        updateData.publishedAt = new Date();
      }
    }
    if (body.responseText) {
      // Only allow editing the response text if the status is draft or approved (not published)
      if (existing.status === "published") {
        return NextResponse.json(
          { error: "Cannot edit a published response. Create a new response instead." },
          { status: 400 }
        );
      }
      updateData.responseText = body.responseText;
    }

    const updated = await prisma.reviewResponse.update({
      where: { id },
      data: updateData,
    });

    // Log activity if published
    if (body.status === "published") {
      await prisma.activityEvent.create({
        data: {
          clientId,
          type: "review_response",
          title: `Review response published on ${existing.platform}`,
          description: `Published response to ${existing.reviewerName}'s ${existing.rating}-star review.`,
        },
      });
    }

    return NextResponse.json({ reviewResponse: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reputation/responses/[id]] PATCH failed:", err);
    return NextResponse.json(
      { error: "Failed to update review response" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a review response
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { clientId } = await requireClient();
    const { id } = await params;

    const existing = await prisma.reviewResponse.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Review response not found" },
        { status: 404 }
      );
    }

    await prisma.reviewResponse.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reputation/responses/[id]] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete review response" },
      { status: 500 }
    );
  }
}
