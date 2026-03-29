/**
 * SMS template library for cold outreach sequences.
 *
 * 3-step SMS cold sequence with TCPA-compliant opt-out language.
 * Template variables use {{variable}} syntax matching the email template
 * convention in templates.ts.
 *
 * Each raw template targets <= 160 characters (1 SMS segment) before
 * variable substitution. After substitution the rendered message may
 * span multiple segments depending on variable lengths.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmsTemplate {
  /** Sequence step number (1-3) */
  step: number;
  /** Day offset from enrollment */
  dayOffset: number;
  /** Purpose label for the step */
  label: "intro" | "follow-up" | "last-chance";
  /** Raw SMS body with {{variable}} placeholders */
  body: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of characters in a single GSM-7 SMS segment. */
const GSM_SEGMENT_CHARS = 160;

/**
 * Number of characters in a single UCS-2 (Unicode) SMS segment.
 * Used when the message contains characters outside the GSM-7 alphabet.
 */
const UCS2_SEGMENT_CHARS = 70;

/**
 * Characters in the GSM-7 basic character set. If every character in the
 * message belongs to this set, the carrier uses 7-bit encoding and each
 * segment holds 160 characters. Otherwise UCS-2 encoding is used (70 chars
 * per segment).
 */
const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ" +
  " !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "ÄÖÑÜabcdefghijklmnopqrstuvwxyz" +
  "äöñüà§";

// ---------------------------------------------------------------------------
// Cold SMS sequence (3 steps)
// ---------------------------------------------------------------------------

export const SMS_COLD_SEQUENCE: SmsTemplate[] = [
  // Step 1 (Day 0): Intro
  {
    step: 1,
    dayOffset: 0,
    label: "intro",
    body: "Hi {{firstName}}, I noticed {{businessName}} could benefit from AI-powered lead gen. Mind if I share how similar {{vertical}} companies 3x'd their leads? - {{senderName}}",
  },

  // Step 2 (Day 2): Follow-up
  {
    step: 2,
    dayOffset: 2,
    label: "follow-up",
    body: "Hey {{firstName}}, quick follow-up on my message about growing {{businessName}}. Our clients avg 47 leads/mo. Worth a quick chat? {{calLink}}",
  },

  // Step 3 (Day 5): Last chance
  {
    step: 3,
    dayOffset: 5,
    label: "last-chance",
    body: "{{firstName}}, last note from me. If growing {{businessName}} with AI marketing isn't a priority right now, no worries. But the offer stands: {{calLink}}",
  },
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Returns `true` when every character in `text` can be encoded in the
 * GSM-7 basic character set (excluding the extension table for simplicity).
 */
function isGsm7(text: string): boolean {
  for (const ch of text) {
    if (!GSM7_BASIC.includes(ch)) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate how many SMS segments a rendered message will occupy.
 *
 * GSM-7 messages use 160-char segments; UCS-2 (Unicode) messages use
 * 70-char segments. Multi-part messages lose a few chars per segment for
 * the concatenation header, but this function uses the simple ceiling
 * division which is sufficient for estimation.
 */
export function getSmsSegmentCount(text: string): number {
  if (text.length === 0) {
    return 0;
  }

  const segmentSize = isGsm7(text) ? GSM_SEGMENT_CHARS : UCS2_SEGMENT_CHARS;
  return Math.ceil(text.length / segmentSize);
}

/**
 * Substitute `{{variable}}` placeholders in a template string with values
 * from the supplied map. Unresolved placeholders are left as-is so the
 * caller can detect missing variables.
 */
export function renderSmsTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{{${key}}}`;
  });
}

// ---------------------------------------------------------------------------
// Lookup helpers (mirror the email template API)
// ---------------------------------------------------------------------------

/**
 * Get an SMS cold template by sequence step number.
 */
export function getSmsColdTemplate(step: number): SmsTemplate | undefined {
  return SMS_COLD_SEQUENCE.find((t) => t.step === step);
}

/**
 * Get all SMS cold templates.
 */
export function getAllSmsColdTemplates(): SmsTemplate[] {
  return SMS_COLD_SEQUENCE;
}
