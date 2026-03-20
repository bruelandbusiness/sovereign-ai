import { NextResponse } from "next/server";
import { authenticateMCP } from "@/lib/mcp/auth";
import { listTools, initMCPTools } from "@/lib/mcp/registry";

export async function GET(request: Request) {
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
  const tools = listTools(ctx.scopes);

  return NextResponse.json({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  });
}
