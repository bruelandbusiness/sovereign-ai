import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { generateCaseStudy } from "@/lib/acquisition/proof-engine";

export const dynamic = "force-dynamic";
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { clientId } = await params;

  try {
    const caseStudyId = await generateCaseStudy(clientId);

    return NextResponse.json({ caseStudyId }, { status: 201 });
  } catch (err) {
    logger.errorWithCause(
      "[api/acquisition/case-studies/generate] Failed to generate case study",
      err
    );

    const message =
      err instanceof Error ? err.message : "Failed to generate case study";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
