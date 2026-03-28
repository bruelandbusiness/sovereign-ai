import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { generateProposal } from "@/lib/acquisition/proposal-generator";

export const dynamic = "force-dynamic";
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { prospectId } = await params;

  try {
    const proposalId = await generateProposal(prospectId);

    return NextResponse.json({ proposalId }, { status: 201 });
  } catch (err) {
    logger.errorWithCause(
      "[api/acquisition/proposals/generate] Failed to generate proposal",
      err
    );

    const message =
      err instanceof Error ? err.message : "Failed to generate proposal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
