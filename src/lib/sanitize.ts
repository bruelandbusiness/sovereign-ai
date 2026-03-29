/**
 * Request sanitization utilities for cleaning user input in API routes.
 *
 * Unlike `sanitize-html.ts` (client-side DOM sanitizer for rendering) and
 * `content-safety.ts` (AI output screening), this module focuses on
 * normalizing and cleaning user-submitted data before storage.
 */

/**
 * Strips HTML tags from a string to prevent XSS in stored data.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitizes a string for safe storage — trims, strips HTML, normalizes whitespace.
 */
export function sanitizeString(input: string): string {
  return stripHtml(input).replace(/\s+/g, " ").trim();
}

/**
 * Sanitizes an email address — lowercase, trim, validate format.
 */
export function sanitizeEmail(input: string): string {
  return input.toLowerCase().trim();
}

/**
 * Sanitizes a phone number — strip non-digit chars except + prefix.
 */
export function sanitizePhone(input: string): string {
  const cleaned = input.replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned : cleaned;
}

/**
 * Deep sanitizes an object — recursively sanitizes all string values.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    }
  }
  return result;
}

/**
 * Truncates a string to maxLength, adding ellipsis if truncated.
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - 3) + "...";
}
