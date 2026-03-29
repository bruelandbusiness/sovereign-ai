/**
 * Accessibility audit utility for WCAG 2.1 compliance.
 * Pure calculation functions — no DOM access.
 */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type A11yLevel = "A" | "AA" | "AAA";

export type A11ySeverity = "critical" | "serious" | "moderate" | "minor";

export interface A11yCheck {
  readonly id: string;
  readonly description: string;
  readonly level: A11yLevel;
  readonly severity: A11ySeverity;
  readonly category: string;
}

export interface A11yResult {
  readonly check: A11yCheck;
  readonly passed: boolean;
  readonly message: string;
  readonly suggestion?: string;
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

type PageType = "form" | "dashboard" | "landing" | "blog";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const COLOR_CONTRAST = {
  /** WCAG 2.1 AA minimum for normal text (< 18pt or < 14pt bold). */
  normalTextAA: 4.5,
  /** WCAG 2.1 AAA minimum for normal text. */
  normalTextAAA: 7,
  /** WCAG 2.1 AA minimum for large text (>= 18pt or >= 14pt bold). */
  largeTextAA: 3,
  /** WCAG 2.1 AAA minimum for large text. */
  largeTextAAA: 4.5,
  /** WCAG 2.1 AA minimum for UI components and graphical objects. */
  uiComponentAA: 3,
} as const;

export const COMMON_A11Y_ISSUES: ReadonlyArray<{
  readonly issue: string;
  readonly fix: string;
  readonly severity: A11ySeverity;
}> = [
  {
    issue: "Images missing alt text",
    fix: "Add descriptive alt attributes to all informative images. Use alt=\"\" for decorative images.",
    severity: "critical",
  },
  {
    issue: "Insufficient color contrast",
    fix: "Ensure text meets WCAG AA contrast ratios: 4.5:1 for normal text, 3:1 for large text.",
    severity: "critical",
  },
  {
    issue: "Missing form labels",
    fix: "Associate every form input with a visible <label> element using the for/id pairing.",
    severity: "critical",
  },
  {
    issue: "No keyboard navigation support",
    fix: "Ensure all interactive elements are reachable and operable via keyboard (Tab, Enter, Escape).",
    severity: "critical",
  },
  {
    issue: "Missing document language attribute",
    fix: "Set the lang attribute on the <html> element (e.g., lang=\"en\").",
    severity: "serious",
  },
  {
    issue: "Empty links or buttons",
    fix: "Provide visible text or an aria-label for every link and button.",
    severity: "serious",
  },
  {
    issue: "Missing skip-navigation link",
    fix: "Add a 'Skip to main content' link as the first focusable element on the page.",
    severity: "serious",
  },
  {
    issue: "Improper heading hierarchy",
    fix: "Use headings in sequential order (h1 -> h2 -> h3) without skipping levels.",
    severity: "serious",
  },
  {
    issue: "Focus indicator not visible",
    fix: "Never remove outline styles without providing an equally visible custom focus indicator.",
    severity: "serious",
  },
  {
    issue: "Auto-playing media without controls",
    fix: "Provide pause, stop, or mute controls for any media that plays automatically.",
    severity: "moderate",
  },
  {
    issue: "Missing ARIA landmarks",
    fix: "Use landmark roles (main, nav, banner, contentinfo) or semantic HTML5 elements.",
    severity: "moderate",
  },
  {
    issue: "Non-descriptive link text",
    fix: "Replace generic text like 'click here' or 'read more' with descriptive link purposes.",
    severity: "moderate",
  },
  {
    issue: "Missing error identification in forms",
    fix: "Clearly identify and describe input errors in text, and associate them with the relevant field.",
    severity: "moderate",
  },
  {
    issue: "Content not resizable to 200%",
    fix: "Use relative units (rem, em, %) so content reflows properly when zoomed to 200%.",
    severity: "minor",
  },
  {
    issue: "Touch targets too small",
    fix: "Ensure interactive touch targets are at least 44x44 CSS pixels.",
    severity: "minor",
  },
] as const;

// ---------------------------------------------------------------------------
// Color Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a hex color string to RGB values.
 *
 * Accepts 3-digit (#abc) or 6-digit (#aabbcc) hex strings,
 * with or without the leading '#'.
 */
export function hexToRgb(hex: string): Rgb {
  let cleaned = hex.replace(/^#/, "");

  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

/**
 * Compute the relative luminance of an RGB color per WCAG 2.1.
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function rgbToRelativeLuminance(rgb: Rgb): number {
  const linearize = (channel: number): number => {
    const srgb = channel / 255;
    return srgb <= 0.04045
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  const rLin = linearize(rgb.r);
  const gLin = linearize(rgb.g);
  const bLin = linearize(rgb.b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

// ---------------------------------------------------------------------------
// Contrast Functions
// ---------------------------------------------------------------------------

/**
 * Calculate the WCAG 2.1 contrast ratio between two hex colors.
 *
 * Returns a value between 1 (identical) and 21 (black on white).
 */
export function calculateContrastRatio(
  hexColor1: string,
  hexColor2: string,
): number {
  const lum1 = rgbToRelativeLuminance(hexToRgb(hexColor1));
  const lum2 = rgbToRelativeLuminance(hexToRgb(hexColor2));

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check whether a foreground/background color pair meets a given
 * WCAG conformance level for either normal or large text.
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  options: {
    readonly level?: A11yLevel;
    readonly isLargeText?: boolean;
  } = {},
): A11yResult {
  const level = options.level ?? "AA";
  const isLargeText = options.isLargeText ?? false;

  const ratio = calculateContrastRatio(foreground, background);

  let requiredRatio: number;
  if (level === "AAA") {
    requiredRatio = isLargeText
      ? COLOR_CONTRAST.largeTextAAA
      : COLOR_CONTRAST.normalTextAAA;
  } else {
    requiredRatio = isLargeText
      ? COLOR_CONTRAST.largeTextAA
      : COLOR_CONTRAST.normalTextAA;
  }

  const passed = ratio >= requiredRatio;
  const roundedRatio = Math.round(ratio * 100) / 100;

  const check: A11yCheck = {
    id: "color-contrast",
    description: `Color contrast meets WCAG ${level} for ${isLargeText ? "large" : "normal"} text`,
    level,
    severity: passed ? "minor" : "critical",
    category: "perceivable",
  };

  return {
    check,
    passed,
    message: passed
      ? `Contrast ratio ${roundedRatio}:1 meets the ${requiredRatio}:1 requirement.`
      : `Contrast ratio ${roundedRatio}:1 does not meet the ${requiredRatio}:1 requirement.`,
    suggestion: passed
      ? undefined
      : `Increase contrast to at least ${requiredRatio}:1. Current ratio is ${roundedRatio}:1.`,
  };
}

// ---------------------------------------------------------------------------
// Accessible Color Suggestion
// ---------------------------------------------------------------------------

/**
 * Suggest an accessible foreground color that meets the required
 * contrast ratio against the given background.
 *
 * Lightens or darkens the foreground color iteratively until
 * the target ratio is reached. Returns the original color if it
 * already passes.
 */
export function suggestAccessibleColor(
  foreground: string,
  background: string,
  options: {
    readonly level?: A11yLevel;
    readonly isLargeText?: boolean;
  } = {},
): string {
  const level = options.level ?? "AA";
  const isLargeText = options.isLargeText ?? false;

  let requiredRatio: number;
  if (level === "AAA") {
    requiredRatio = isLargeText
      ? COLOR_CONTRAST.largeTextAAA
      : COLOR_CONTRAST.normalTextAAA;
  } else {
    requiredRatio = isLargeText
      ? COLOR_CONTRAST.largeTextAA
      : COLOR_CONTRAST.normalTextAA;
  }

  const currentRatio = calculateContrastRatio(foreground, background);
  if (currentRatio >= requiredRatio) {
    return foreground;
  }

  const bgLuminance = rgbToRelativeLuminance(hexToRgb(background));
  const shouldDarken = bgLuminance > 0.5;

  const fg = hexToRgb(foreground);
  let bestHex = foreground;
  let bestRatio = currentRatio;

  for (let step = 1; step <= 255; step++) {
    const adjust = shouldDarken ? -step : step;
    const r = Math.min(255, Math.max(0, fg.r + adjust));
    const g = Math.min(255, Math.max(0, fg.g + adjust));
    const b = Math.min(255, Math.max(0, fg.b + adjust));

    const candidate = rgbToHex(r, g, b);
    const ratio = calculateContrastRatio(candidate, background);

    if (ratio >= requiredRatio) {
      return candidate;
    }

    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestHex = candidate;
    }
  }

  return bestHex;
}

/** Convert individual RGB channel values to a 6-digit hex string. */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string =>
    Math.min(255, Math.max(0, Math.round(n)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// Checklist Generator
// ---------------------------------------------------------------------------

/**
 * Return a list of accessibility checks appropriate for a given page type.
 */
export function generateA11yChecklist(pageType: PageType): readonly A11yCheck[] {
  const shared: readonly A11yCheck[] = [
    {
      id: "lang-attribute",
      description: "Page has a valid lang attribute on the html element",
      level: "A",
      severity: "serious",
      category: "understandable",
    },
    {
      id: "page-title",
      description: "Page has a unique, descriptive <title>",
      level: "A",
      severity: "serious",
      category: "operable",
    },
    {
      id: "heading-hierarchy",
      description: "Headings follow a logical hierarchy (h1 -> h2 -> h3)",
      level: "A",
      severity: "serious",
      category: "perceivable",
    },
    {
      id: "color-contrast",
      description: "All text meets WCAG AA contrast requirements",
      level: "AA",
      severity: "critical",
      category: "perceivable",
    },
    {
      id: "keyboard-navigation",
      description: "All interactive elements are keyboard accessible",
      level: "A",
      severity: "critical",
      category: "operable",
    },
    {
      id: "skip-navigation",
      description: "A skip-navigation link is the first focusable element",
      level: "A",
      severity: "serious",
      category: "operable",
    },
    {
      id: "image-alt",
      description: "All informative images have descriptive alt text",
      level: "A",
      severity: "critical",
      category: "perceivable",
    },
    {
      id: "focus-visible",
      description: "Focus indicators are visible on all interactive elements",
      level: "AA",
      severity: "serious",
      category: "operable",
    },
    {
      id: "landmarks",
      description: "ARIA landmarks or HTML5 semantic elements are used",
      level: "A",
      severity: "moderate",
      category: "perceivable",
    },
    {
      id: "text-resize",
      description: "Content is readable and functional at 200% zoom",
      level: "AA",
      severity: "moderate",
      category: "perceivable",
    },
  ];

  const pageSpecific: Record<PageType, readonly A11yCheck[]> = {
    form: [
      {
        id: "form-labels",
        description: "Every input has an associated visible label",
        level: "A",
        severity: "critical",
        category: "perceivable",
      },
      {
        id: "error-identification",
        description: "Form errors are clearly described in text and associated with the input",
        level: "A",
        severity: "critical",
        category: "understandable",
      },
      {
        id: "error-suggestion",
        description: "Correction suggestions are provided when input errors are detected",
        level: "AA",
        severity: "serious",
        category: "understandable",
      },
      {
        id: "input-purpose",
        description: "Input purpose is programmatically determinable (autocomplete attributes)",
        level: "AA",
        severity: "moderate",
        category: "understandable",
      },
      {
        id: "required-fields",
        description: "Required fields are indicated visually and programmatically",
        level: "A",
        severity: "serious",
        category: "understandable",
      },
    ],
    dashboard: [
      {
        id: "data-table-headers",
        description: "Data tables have proper header cells and scope attributes",
        level: "A",
        severity: "critical",
        category: "perceivable",
      },
      {
        id: "chart-alternatives",
        description: "Charts and graphs have text alternatives or data tables",
        level: "A",
        severity: "critical",
        category: "perceivable",
      },
      {
        id: "live-regions",
        description: "Dynamic content updates use ARIA live regions",
        level: "A",
        severity: "serious",
        category: "perceivable",
      },
      {
        id: "complex-widgets",
        description: "Complex widgets follow ARIA authoring practices",
        level: "A",
        severity: "serious",
        category: "operable",
      },
      {
        id: "status-messages",
        description: "Status messages are conveyed to assistive technology without focus change",
        level: "AA",
        severity: "moderate",
        category: "perceivable",
      },
    ],
    landing: [
      {
        id: "cta-descriptive",
        description: "Call-to-action buttons have descriptive, unique text",
        level: "A",
        severity: "serious",
        category: "operable",
      },
      {
        id: "media-captions",
        description: "Videos have captions and audio descriptions where needed",
        level: "A",
        severity: "critical",
        category: "perceivable",
      },
      {
        id: "animation-control",
        description: "Users can pause, stop, or hide moving/auto-updating content",
        level: "A",
        severity: "serious",
        category: "operable",
      },
      {
        id: "link-purpose",
        description: "Link purpose is clear from the link text or context",
        level: "A",
        severity: "moderate",
        category: "operable",
      },
    ],
    blog: [
      {
        id: "reading-order",
        description: "Content reading order is logical when CSS is disabled",
        level: "A",
        severity: "serious",
        category: "perceivable",
      },
      {
        id: "link-distinguishable",
        description: "Links are distinguishable from surrounding text (not by color alone)",
        level: "A",
        severity: "moderate",
        category: "perceivable",
      },
      {
        id: "code-block-accessible",
        description: "Code blocks use appropriate markup and are screen-reader friendly",
        level: "A",
        severity: "moderate",
        category: "perceivable",
      },
      {
        id: "content-structure",
        description: "Content uses lists, blockquotes, and other semantic markup appropriately",
        level: "A",
        severity: "moderate",
        category: "perceivable",
      },
    ],
  };

  return [...shared, ...pageSpecific[pageType]];
}

// ---------------------------------------------------------------------------
// ARIA Validation
// ---------------------------------------------------------------------------

const VAGUE_ARIA_PATTERNS: readonly RegExp[] = [
  /^click$/i,
  /^click here$/i,
  /^here$/i,
  /^link$/i,
  /^button$/i,
  /^submit$/i,
  /^image$/i,
  /^icon$/i,
  /^logo$/i,
  /^\.+$/,
  /^\s*$/,
  /^more$/i,
  /^read more$/i,
  /^info$/i,
  /^details$/i,
];

/**
 * Validate whether an aria-label value is descriptive enough.
 *
 * Checks for:
 * - Empty or whitespace-only labels
 * - Extremely short labels (< 2 characters)
 * - Common vague/generic labels
 * - Labels that are excessively long (> 150 characters)
 */
export function validateAriaLabel(label: string): A11yResult {
  const check: A11yCheck = {
    id: "aria-label-quality",
    description: "aria-label text is sufficiently descriptive",
    level: "A",
    severity: "serious",
    category: "perceivable",
  };

  const trimmed = label.trim();

  if (trimmed.length === 0) {
    return {
      check,
      passed: false,
      message: "aria-label is empty or whitespace-only.",
      suggestion: "Provide a concise, descriptive label that conveys the element's purpose.",
    };
  }

  if (trimmed.length < 2) {
    return {
      check,
      passed: false,
      message: `aria-label "${trimmed}" is too short to be descriptive.`,
      suggestion: "Use a label with at least 2 characters that describes the element's purpose.",
    };
  }

  if (trimmed.length > 150) {
    return {
      check,
      passed: false,
      message: "aria-label exceeds 150 characters and may be too verbose.",
      suggestion:
        "Keep aria-label concise (under 150 characters). Move longer descriptions to aria-describedby.",
    };
  }

  const isVague = VAGUE_ARIA_PATTERNS.some((pattern) => pattern.test(trimmed));
  if (isVague) {
    return {
      check,
      passed: false,
      message: `aria-label "${trimmed}" is too generic to be useful.`,
      suggestion:
        "Replace with a label describing the specific purpose, e.g., 'Submit contact form' instead of 'Submit'.",
    };
  }

  return {
    check,
    passed: true,
    message: `aria-label "${trimmed}" appears sufficiently descriptive.`,
  };
}
