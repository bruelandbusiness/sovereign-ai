// Shared utilities for Anthropic AI integration
// Provides prompt sanitization, error handling, and response extraction

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

// ── Prompt Sanitization ─────────────────────────────────────

/**
 * Sanitize a user-controlled string before interpolating into a prompt.
 * Strips common prompt injection patterns and limits length.
 *
 * This prevents user-supplied values (business names, review text, etc.)
 * from manipulating the AI's system instructions.
 */
export function sanitizeForPrompt(input: string, maxLength = 1000): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input.slice(0, maxLength);

  // Strip patterns that attempt to override system instructions
  sanitized = sanitized
    // Remove attempts to inject system/assistant role markers
    .replace(/\b(system|assistant)\s*:/gi, "")
    // Remove XML-like tags that could be interpreted as instruction boundaries
    .replace(/<\/?(?:system|instructions?|prompt|context|override|ignore|admin|role)\b[^>]*>/gi, "")
    // Remove attempts to use markdown heading separators as instruction boundaries
    .replace(/^---+\s*$/gm, "")
    // Remove "ignore previous instructions" patterns
    .replace(/ignore\s+(?:all\s+)?(?:previous|above|prior)\s+(?:instructions?|prompts?|rules?|guidelines?)/gi, "[filtered]")
    // Remove "you are now" role reassignment attempts
    .replace(/you\s+are\s+now\s+/gi, "[filtered] ")
    // Remove "new instructions" patterns
    .replace(/(?:new|updated?|revised?|override)\s+(?:instructions?|system\s+prompt|rules?)\s*:/gi, "[filtered]:");

  return sanitized.trim();
}

// ── Error Handling ──────────────────────────────────────────

/**
 * Classify an Anthropic API error and return a user-friendly message
 * along with the appropriate HTTP status code.
 */
export function handleAnthropicError(error: unknown): {
  message: string;
  status: number;
  retryable: boolean;
} {
  // Handle Anthropic SDK specific errors
  if (error instanceof Anthropic.APIError) {
    const status = error.status;

    if (status === 401) {
      logger.error("[ai-utils] Anthropic authentication error");
      return {
        message: "AI service configuration error. Please contact support.",
        status: 503,
        retryable: false,
      };
    }

    if (status === 429) {
      logger.warn("[ai-utils] Anthropic rate limit exceeded");
      return {
        message: "Our AI service is experiencing high demand. Please try again in a moment.",
        status: 429,
        retryable: true,
      };
    }

    if (status === 529) {
      logger.warn("[ai-utils] Anthropic API overloaded");
      return {
        message: "Our AI service is temporarily overloaded. Please try again in a few minutes.",
        status: 503,
        retryable: true,
      };
    }

    if (status === 400) {
      logger.error("[ai-utils] Anthropic bad request", { message: error.message });
      return {
        message: "Failed to process request. The input may be too long or contain invalid content.",
        status: 400,
        retryable: false,
      };
    }

    if (status === 500 || status === 502 || status === 503) {
      logger.error(`[ai-utils] Anthropic server error (${status})`, { message: error.message });
      return {
        message: "AI service is temporarily unavailable. Please try again shortly.",
        status: 503,
        retryable: true,
      };
    }

    // Catch-all for other API errors
    logger.error(`[ai-utils] Anthropic API error (${status})`, { message: error.message });
    return {
      message: "An error occurred with the AI service. Please try again.",
      status: 502,
      retryable: true,
    };
  }

  // Handle timeout errors
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    logger.warn("[ai-utils] Anthropic API timeout");
    return {
      message: "AI request timed out. Please try again.",
      status: 504,
      retryable: true,
    };
  }

  // Handle connection errors
  if (error instanceof Anthropic.APIConnectionError) {
    logger.warn("[ai-utils] Anthropic API connection error");
    return {
      message: "Could not connect to AI service. Please try again.",
      status: 503,
      retryable: true,
    };
  }

  // Generic/unknown errors
  logger.errorWithCause("[ai-utils] Unknown AI error", error);
  return {
    message: "An unexpected error occurred. Please try again.",
    status: 500,
    retryable: false,
  };
}

// ── Response Extraction ─────────────────────────────────────

/**
 * Safely extract text content from an Anthropic response.
 * Returns a fallback string if no text block is found.
 */
export function extractTextContent(
  response: Anthropic.Message,
  fallback = ""
): string {
  if (!response.content || response.content.length === 0) {
    return fallback;
  }
  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : fallback;
}

/**
 * Safely extract and parse JSON from an Anthropic response.
 * Attempts to find JSON in the response text (handles markdown code fences).
 * Returns the parsed object or the fallback value on failure.
 */
export function extractJSONContent<T>(
  response: Anthropic.Message,
  fallback: T
): T {
  const text = extractTextContent(response, "");
  if (!text) return fallback;

  try {
    return JSON.parse(text) as T;
  } catch {
    // Try to extract JSON from markdown code fences or find object/array
    const jsonMatch = text.match(/(?:\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        // Fall through
      }
    }
  }

  return fallback;
}
