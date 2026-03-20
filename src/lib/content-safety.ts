/**
 * Content safety filter for AI-generated text.
 *
 * Screens AI output before it is stored or published. The filter is intentionally
 * conservative — it catches obvious harmful patterns that should never appear in
 * business marketing content. It is NOT a replacement for the model's own safety
 * guardrails, but a defense-in-depth layer.
 */

// ── Blocked patterns ─────────────────────────────────────────────────────────
// Each entry is a regex (case-insensitive) and a human-readable reason.

const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Explicit / adult content
  {
    pattern:
      /\b(porn(ograph(y|ic))?|xxx|sex\s*work|escort\s*service|adult\s*entertainment|explicit\s*content)\b/i,
    reason: "Explicit or adult content detected",
  },
  // Violence / hate speech
  {
    pattern:
      /\b(kill\s+(all|them|yourself)|ethnic\s*cleansing|white\s*supremac|genocide\b|lynch\s*mob|racial\s*slur)/i,
    reason: "Violent or hateful content detected",
  },
  // Illegal activities
  {
    pattern:
      /\b(how\s+to\s+(hack|steal|forge|counterfeit|launder)|buy\s+(drugs|firearms)\s+online|illegal\s+downloads?)\b/i,
    reason: "Content promoting illegal activities detected",
  },
  // Scam / phishing language
  {
    pattern:
      /\b(wire\s+transfer\s+immediately|send\s+bitcoin|nigerian\s+prince|you'?ve\s+won\s+a?\s*(million|lottery)|claim\s+your\s+prize\s+now)\b/i,
    reason: "Scam or phishing language detected",
  },
  // Medical / legal misinformation
  {
    pattern:
      /\b(guaranteed\s+cure|100%?\s+effective\s+(treatment|medicine)|no\s+side\s+effects\s+whatsoever|miracle\s+cure|FDA\s+approved)\b/i,
    reason: "Potentially misleading health claims detected",
  },
  // Prompt injection artifacts — AI regurgitating system instructions
  {
    pattern:
      /\b(ignore\s+previous\s+instructions|you\s+are\s+an?\s+AI|as\s+an?\s+AI\s+language\s+model|my\s+previous\s+instructions\s+were|system\s*:\s*you\s+are)\b/i,
    reason: "AI prompt injection or system instructions leak detected",
  },
];

// ── Maximum content length (characters) ──────────────────────────────────────
const MAX_CONTENT_LENGTH = 50_000;

// ── Public API ───────────────────────────────────────────────────────────────

export interface ContentSafetyResult {
  safe: boolean;
  /** Non-empty only when `safe` is false */
  reasons: string[];
}

/**
 * Screen a piece of AI-generated content for safety.
 *
 * Returns `{ safe: true, reasons: [] }` if the content passes all checks.
 */
export function screenContent(content: string): ContentSafetyResult {
  const reasons: string[] = [];

  if (!content || content.trim().length === 0) {
    return { safe: false, reasons: ["Content is empty"] };
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    reasons.push(
      `Content exceeds maximum length (${content.length} > ${MAX_CONTENT_LENGTH} characters)`
    );
  }

  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      reasons.push(reason);
    }
  }

  return {
    safe: reasons.length === 0,
    reasons,
  };
}

/**
 * Sanitize content by stripping raw HTML tags that could be used for XSS
 * when rendered. Markdown tags (like # headers, **bold**) are preserved.
 */
export function sanitizeContent(content: string): string {
  // Strip HTML script / iframe / object / embed tags
  return content
    .replace(/<\s*script[\s>][\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*iframe[\s>][\s\S]*?<\s*\/\s*iframe\s*>/gi, "")
    .replace(/<\s*object[\s>][\s\S]*?<\s*\/\s*object\s*>/gi, "")
    .replace(/<\s*embed[\s>][\s\S]*?<\s*\/\s*embed\s*>/gi, "")
    .replace(/<\s*link[\s>][^>]*>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
}
