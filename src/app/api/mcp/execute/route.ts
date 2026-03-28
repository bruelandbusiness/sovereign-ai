import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateMCP, hasScope, logUsage } from "@/lib/mcp/auth";
import { getTool, initMCPTools } from "@/lib/mcp/registry";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const executeSchema = z.object({
  tool: z.string().min(1).max(100),
  input: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  initMCPTools();
  const authResult = await authenticateMCP(request);

  if (!authResult.ok) {
    const { failure } = authResult;

    if (failure.reason === "rate_limited") {
      const retryAfterSec = Math.ceil((failure.retryAfterMs ?? 60000) / 1000);
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        },
      );
    }

    if (failure.reason === "revoked" || failure.reason === "expired") {
      return NextResponse.json(
        { error: `API key is ${failure.reason}` },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Invalid or missing API key" },
      { status: 401 },
    );
  }

  const { ctx } = authResult;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = executeSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { tool: toolName, input } = parsed.data;

  const tool = getTool(toolName);
  if (!tool) {
    return NextResponse.json(
      { error: `Unknown tool: ${toolName}` },
      { status: 404 },
    );
  }

  // Check scopes
  if (!tool.requiredScopes.every((s) => hasScope(ctx, s))) {
    return NextResponse.json(
      { error: "Insufficient scopes" },
      { status: 403 },
    );
  }

  const start = Date.now();
  try {
    const result = await tool.handler(input || {}, ctx);
    const durationMs = Date.now() - start;

    // Log usage (fire-and-forget, but log errors for observability)
    logUsage(ctx.apiKeyId, toolName, input || {}, result, durationMs).catch(
      (err) =>
        logger.error(
          "[mcp/execute] Usage logging failed:",
          err instanceof Error ? err.message : err,
        ),
    );

    return NextResponse.json({ result });
  } catch (error) {
    logger.errorWithCause("[mcp/execute]", error);
    const durationMs = Date.now() - start;
    logUsage(ctx.apiKeyId, toolName, input || {}, null, durationMs).catch(
      (err) =>
        logger.error(
          "[mcp/execute] Usage logging failed:",
          err instanceof Error ? err.message : err,
        ),
    );

    return NextResponse.json(
      {
        error: "Tool execution failed",
      },
      { status: 500 },
    );
  }
}
