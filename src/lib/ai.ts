// Vercel AI SDK — Anthropic provider singleton
// Used by streaming endpoints (e.g. chatbot) via the `ai` package.

import { createAnthropic } from "@ai-sdk/anthropic";
import { logger } from "@/lib/logger";

let _provider: ReturnType<typeof createAnthropic> | null = null;

/**
 * Returns the shared Anthropic provider for use with the Vercel AI SDK.
 * Throws a descriptive error when ANTHROPIC_API_KEY is missing so callers
 * can return a user-friendly response instead of a cryptic 401.
 */
export function getAnthropicProvider(): ReturnType<typeof createAnthropic> {
  if (!_provider) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.error("[ai] ANTHROPIC_API_KEY is not configured");
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. AI features are unavailable."
      );
    }
    _provider = createAnthropic({ apiKey });
  }
  return _provider;
}
