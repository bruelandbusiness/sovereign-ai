import { registerTool } from "../registry";
import {
  getClientBenchmarks,
  getVerticalBenchmarks,
} from "@/lib/intelligence/benchmarks";
import { z } from "zod";

const inputSchema = z.object({
  vertical: z
    .enum([
      "hvac",
      "plumbing",
      "roofing",
      "electrical",
      "landscaping",
      "cleaning",
      "pest-control",
    ])
    .optional()
    .default("hvac"),
  region: z
    .string()
    .max(2)
    .regex(/^[A-Z]{2}$/, "Must be a two-letter state code (e.g. CA, TX)")
    .optional(),
});

registerTool({
  name: "intelligence.getBenchmarks",
  description:
    "Get anonymized industry benchmarks for a vertical. If authenticated as a client, also returns your position relative to benchmarks.",
  inputSchema: {
    type: "object",
    properties: {
      vertical: {
        type: "string",
        description:
          "Industry vertical: hvac | plumbing | roofing | electrical | landscaping | cleaning | pest-control",
      },
      region: {
        type: "string",
        description: "State code (e.g., CA, TX) for regional benchmarks",
      },
    },
  },
  requiredScopes: ["intelligence.read"],
  handler: async (input, ctx) => {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid input" };

    // If client context, return personalized comparison
    if (ctx.clientId) {
      const benchmarks = await getClientBenchmarks(ctx.clientId);
      return { benchmarks, personalized: true };
    }

    // Otherwise return vertical benchmarks
    const vertical = parsed.data.vertical || "hvac";
    const region = parsed.data.region;
    const benchmarks = await getVerticalBenchmarks(vertical, region);

    return {
      vertical,
      region: region || "national",
      benchmarks: benchmarks.map((b) => ({
        metric: b.metric,
        p25: b.p25,
        p50: b.p50,
        p75: b.p75,
        p90: b.p90,
        sampleSize: b.sampleSize,
      })),
      personalized: false,
    };
  },
});
