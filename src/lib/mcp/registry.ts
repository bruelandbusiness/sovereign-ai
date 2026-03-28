import type { MCPContext } from "./auth";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiredScopes: string[];
  handler: (
    input: Record<string, unknown>,
    ctx: MCPContext,
  ) => Promise<Record<string, unknown>>;
}

const tools: Map<string, MCPTool> = new Map();

export function registerTool(tool: MCPTool): void {
  if (tool.requiredScopes.length === 0) {
    throw new Error(`MCP tool "${tool.name}" must have at least one required scope`);
  }
  tools.set(tool.name, tool);
}

export function getTool(name: string): MCPTool | undefined {
  return tools.get(name);
}

export function listTools(scopes: string[]): MCPTool[] {
  return Array.from(tools.values()).filter((tool) =>
    tool.requiredScopes.every(
      (s) => scopes.includes(s) || scopes.includes("*"),
    ),
  );
}

// Tools are registered via initMCPTools() — call this before using the registry
let initialized = false;

export function initMCPTools(): void {
  if (initialized) return;
  initialized = true;
  // Lazy require to avoid circular dependency at module level
  /* eslint-disable @typescript-eslint/no-require-imports */
  require("./tools/client-leads");
  require("./tools/client-metrics");
  require("./tools/intelligence-benchmarks");
  require("./tools/intelligence-insights");
  require("./tools/agency-clients");
  /* eslint-enable @typescript-eslint/no-require-imports */
}
