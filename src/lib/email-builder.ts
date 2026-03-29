/**
 * Email template builder utility.
 *
 * Provides composable, type-safe components for building rich HTML emails.
 * Complements the existing email system in `@/lib/email` by offering
 * pre-built sections that compose into full emails via `buildEmail()`.
 *
 * All HTML output uses inline styles for maximum email-client compatibility.
 * User-supplied strings are escaped via `escapeHtml` to prevent injection.
 */

import { escapeHtml, safeHttpUrl, emailLayout, htmlToPlainText } from "@/lib/email";

// ─── Type Definitions ─────────────────────────────────────────

/** Supported email component types. */
export type EmailComponentType =
  | "hero"
  | "metrics-grid"
  | "cta-button"
  | "testimonial"
  | "footer"
  | "divider"
  | "image"
  | "text";

/** Base style properties applied via inline CSS. */
export interface EmailStyle {
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly padding?: string;
  readonly margin?: string;
  readonly borderRadius?: string;
  readonly textAlign?: "left" | "center" | "right";
  readonly fontSize?: string;
  readonly fontWeight?: string;
  readonly lineHeight?: string;
  readonly border?: string;
  readonly maxWidth?: string;
}

/** A rendered email component with its HTML output. */
export interface EmailComponent {
  readonly type: EmailComponentType;
  readonly html: string;
}

/** A section containing one or more components with optional wrapper styles. */
export interface EmailSection {
  readonly components: readonly EmailComponent[];
  readonly style?: EmailStyle;
}

/** A complete email template ready for rendering. */
export interface EmailTemplate {
  readonly subject: string;
  readonly preheader?: string;
  readonly sections: readonly EmailSection[];
  readonly unsubscribeUrl?: string;
  readonly isTransactional?: boolean;
}

/** KPI metric for the metrics grid. */
export interface MetricItem {
  readonly label: string;
  readonly value: string;
  readonly change?: string;
  readonly changeDirection?: "up" | "down" | "neutral";
}

/** Social link for the footer. */
export interface SocialLink {
  readonly platform: string;
  readonly url: string;
  readonly label?: string;
}

// ─── Style Helpers ────────────────────────────────────────────

/**
 * Convert an EmailStyle object into an inline CSS string.
 * Returns an empty string when no styles are provided.
 */
function styleToInline(style?: EmailStyle): string {
  if (!style) return "";

  const map: Record<string, string | undefined> = {
    "background-color": style.backgroundColor,
    color: style.color,
    padding: style.padding,
    margin: style.margin,
    "border-radius": style.borderRadius,
    "text-align": style.textAlign,
    "font-size": style.fontSize,
    "font-weight": style.fontWeight,
    "line-height": style.lineHeight,
    border: style.border,
    "max-width": style.maxWidth,
  };

  const parts: string[] = [];
  for (const [prop, val] of Object.entries(map)) {
    if (val !== undefined) {
      parts.push(`${prop}:${val}`);
    }
  }

  return parts.join(";");
}

/**
 * Apply inline CSS styles to an HTML string by wrapping it in a styled div.
 * If no styles are provided the HTML is returned unchanged.
 */
export function inlineStyles(html: string, style?: EmailStyle): string {
  const css = styleToInline(style);
  if (!css) return html;
  return `<div style="${css}">${html}</div>`;
}

// ─── Component Functions ──────────────────────────────────────

/**
 * Full-width hero header with title and optional subtitle.
 */
export function heroSection(opts: {
  readonly title: string;
  readonly subtitle?: string;
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly style?: EmailStyle;
}): EmailComponent {
  const bg = opts.backgroundColor ?? "#0a0a0f";
  const fg = opts.textColor ?? "#ffffff";

  const subtitleHtml = opts.subtitle
    ? `<p style="color:${fg};font-size:16px;margin:12px 0 0;opacity:0.85;line-height:1.5;">${escapeHtml(opts.subtitle)}</p>`
    : "";

  const baseStyle = [
    `background-color:${bg}`,
    `padding:48px 32px`,
    `text-align:center`,
    `border-radius:8px 8px 0 0`,
  ].join(";");

  const extraCss = styleToInline(opts.style);
  const combinedStyle = extraCss ? `${baseStyle};${extraCss}` : baseStyle;

  const html = `
    <div style="${combinedStyle}">
      <h1 style="color:${fg};font-size:28px;margin:0;font-weight:700;line-height:1.3;">
        ${escapeHtml(opts.title)}
      </h1>
      ${subtitleHtml}
    </div>
  `;

  return { type: "hero", html };
}

/**
 * Grid of 2-4 KPI metrics displayed in a table row.
 */
export function metricsGrid(opts: {
  readonly metrics: readonly MetricItem[];
  readonly columns?: 2 | 3 | 4;
  readonly style?: EmailStyle;
}): EmailComponent {
  const cols = opts.columns ?? Math.min(opts.metrics.length, 4) as 2 | 3 | 4;
  const colWidth = Math.floor(100 / cols);

  const cells = opts.metrics.slice(0, cols).map((metric) => {
    const changeColor =
      metric.changeDirection === "up"
        ? "#22c55e"
        : metric.changeDirection === "down"
          ? "#ef4444"
          : "#6b7280";

    const changeHtml = metric.change
      ? `<span style="font-size:12px;color:${changeColor};font-weight:500;">${escapeHtml(metric.change)}</span>`
      : "";

    return `
      <td style="width:${colWidth}%;text-align:center;padding:16px 8px;vertical-align:top;">
        <div style="font-size:28px;font-weight:700;color:#0a0a0f;line-height:1.2;">
          ${escapeHtml(metric.value)}
        </div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">
          ${escapeHtml(metric.label)}
        </div>
        ${changeHtml ? `<div style="margin-top:4px;">${changeHtml}</div>` : ""}
      </td>
    `;
  });

  const extraCss = styleToInline(opts.style);
  const tableStyle = `width:100%;border-collapse:collapse;margin:24px 0;${extraCss}`;

  const html = `
    <table style="${tableStyle}" role="presentation">
      <tr>${cells.join("")}</tr>
    </table>
  `;

  return { type: "metrics-grid", html };
}

/**
 * Styled call-to-action button.
 *
 * Follows the existing `emailButton` pattern from `@/lib/email`
 * with support for additional variants and custom styles.
 */
export function ctaButton(opts: {
  readonly text: string;
  readonly url: string;
  readonly variant?: "primary" | "danger" | "secondary";
  readonly style?: EmailStyle;
}): EmailComponent {
  const variant = opts.variant ?? "primary";

  let bg: string;
  let bgFallback: string;
  let textColor: string;
  let border: string;

  switch (variant) {
    case "danger":
      bg = "#ef4444";
      bgFallback = "#ef4444";
      textColor = "#ffffff";
      border = "none";
      break;
    case "secondary":
      bg = "#ffffff";
      bgFallback = "#ffffff";
      textColor = "#0a0a0f";
      border = "2px solid #d1d5db";
      break;
    default:
      bg = "linear-gradient(135deg, #4c85ff, #22d3a1)";
      bgFallback = "#4c85ff";
      textColor = "#ffffff";
      border = "none";
      break;
  }

  const extraCss = styleToInline(opts.style);
  const linkStyle = [
    `display:inline-block`,
    `background:${bg}`,
    `background-color:${bgFallback}`,
    `color:${textColor}`,
    `padding:14px 32px`,
    `border-radius:8px`,
    `text-decoration:none`,
    `font-weight:600`,
    `font-size:16px`,
    `border:${border}`,
    extraCss,
  ]
    .filter(Boolean)
    .join(";");

  const html = `
    <div style="text-align:center;margin:32px 0;">
      <a href="${safeHttpUrl(opts.url)}" style="${linkStyle}">
        ${escapeHtml(opts.text)}
      </a>
    </div>
  `;

  return { type: "cta-button", html };
}

/**
 * Customer testimonial / quote block with attribution.
 */
export function testimonialBlock(opts: {
  readonly quote: string;
  readonly authorName: string;
  readonly authorTitle?: string;
  readonly avatarUrl?: string;
  readonly style?: EmailStyle;
}): EmailComponent {
  const avatarHtml = opts.avatarUrl
    ? `<img src="${safeHttpUrl(opts.avatarUrl)}" alt="${escapeHtml(opts.authorName)}" width="48" height="48" style="border-radius:50%;margin-right:12px;vertical-align:middle;" />`
    : "";

  const titleHtml = opts.authorTitle
    ? `<span style="color:#6b7280;font-size:13px;display:block;">${escapeHtml(opts.authorTitle)}</span>`
    : "";

  const extraCss = styleToInline(opts.style);
  const blockStyle = `background-color:#f9fafb;border-left:4px solid #4c85ff;padding:24px;margin:24px 0;border-radius:0 8px 8px 0;${extraCss}`;

  const html = `
    <div style="${blockStyle}">
      <p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px;font-style:italic;">
        &ldquo;${escapeHtml(opts.quote)}&rdquo;
      </p>
      <div style="display:flex;align-items:center;">
        ${avatarHtml}
        <div>
          <span style="font-weight:600;color:#0a0a0f;font-size:14px;">${escapeHtml(opts.authorName)}</span>
          ${titleHtml}
        </div>
      </div>
    </div>
  `;

  return { type: "testimonial", html };
}

/**
 * Email footer with unsubscribe link, company info, and social links.
 */
export function footerSection(opts: {
  readonly companyName?: string;
  readonly companyAddress?: string;
  readonly unsubscribeUrl?: string;
  readonly socialLinks?: readonly SocialLink[];
  readonly style?: EmailStyle;
}): EmailComponent {
  const company = opts.companyName ?? "Sovereign AI, Inc.";
  const address = opts.companyAddress ?? "";

  const unsubHtml = opts.unsubscribeUrl
    ? `<a href="${safeHttpUrl(opts.unsubscribeUrl)}" style="color:#999;text-decoration:underline;">Unsubscribe</a>`
    : "";

  const socialHtml =
    opts.socialLinks && opts.socialLinks.length > 0
      ? `<div style="margin-top:12px;">${opts.socialLinks
          .map(
            (link) =>
              `<a href="${safeHttpUrl(link.url)}" style="color:#6b7280;text-decoration:none;margin:0 8px;font-size:13px;">${escapeHtml(link.label ?? link.platform)}</a>`
          )
          .join(" | ")}</div>`
      : "";

  const extraCss = styleToInline(opts.style);
  const wrapperStyle = `text-align:center;padding:24px 0;margin-top:32px;border-top:1px solid #eee;${extraCss}`;

  const html = `
    <div style="${wrapperStyle}">
      <p style="color:#999;font-size:12px;margin:0;">
        ${escapeHtml(company)}
        ${address ? `<br />${escapeHtml(address)}` : ""}
        ${unsubHtml ? `<br />${unsubHtml}` : ""}
      </p>
      ${socialHtml}
    </div>
  `;

  return { type: "footer", html };
}

/**
 * Horizontal divider / separator line.
 */
export function dividerLine(opts?: {
  readonly color?: string;
  readonly thickness?: string;
  readonly margin?: string;
  readonly style?: EmailStyle;
}): EmailComponent {
  const color = opts?.color ?? "#eee";
  const thickness = opts?.thickness ?? "1px";
  const margin = opts?.margin ?? "32px 0";
  const extraCss = styleToInline(opts?.style);

  const hrStyle = `border:none;border-top:${thickness} solid ${color};margin:${margin};${extraCss}`;

  const html = `<hr style="${hrStyle}" />`;

  return { type: "divider", html };
}

/**
 * Responsive image block with alt text.
 */
export function imageBlock(opts: {
  readonly src: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
  readonly align?: "left" | "center" | "right";
  readonly style?: EmailStyle;
}): EmailComponent {
  const align = opts.align ?? "center";
  const widthAttr = opts.width ? ` width="${opts.width}"` : "";
  const heightAttr = opts.height ? ` height="${opts.height}"` : "";
  const extraCss = styleToInline(opts.style);

  const imgStyle = `max-width:100%;height:auto;display:block;border:0;${extraCss}`;
  const wrapperStyle = `text-align:${align};margin:24px 0;`;

  const html = `
    <div style="${wrapperStyle}">
      <img src="${safeHttpUrl(opts.src)}" alt="${escapeHtml(opts.alt)}"${widthAttr}${heightAttr} style="${imgStyle}" />
    </div>
  `;

  return { type: "image", html };
}

/**
 * Text paragraph block with optional heading.
 */
export function textBlock(opts: {
  readonly text: string;
  readonly heading?: string;
  readonly headingLevel?: 1 | 2 | 3 | 4;
  readonly style?: EmailStyle;
}): EmailComponent {
  const level = opts.headingLevel ?? 2;
  const headingSizes: Record<number, string> = {
    1: "24px",
    2: "20px",
    3: "18px",
    4: "16px",
  };
  const fontSize = headingSizes[level] ?? "20px";
  const extraCss = styleToInline(opts.style);

  const headingHtml = opts.heading
    ? `<h${level} style="color:#0a0a0f;font-size:${fontSize};margin:0 0 12px;font-weight:600;line-height:1.3;">${escapeHtml(opts.heading)}</h${level}>`
    : "";

  const wrapperStyle = `margin:24px 0;${extraCss}`;

  const html = `
    <div style="${wrapperStyle}">
      ${headingHtml}
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0;">
        ${escapeHtml(opts.text)}
      </p>
    </div>
  `;

  return { type: "text", html };
}

// ─── Builder Functions ────────────────────────────────────────

/**
 * Render a single section by concatenating its component HTML
 * and wrapping in an optional styled container.
 */
function renderSection(section: EmailSection): string {
  const inner = section.components.map((c) => c.html).join("\n");
  return inlineStyles(inner, section.style);
}

/**
 * Compose sections into a complete email HTML string using the
 * existing `emailLayout` wrapper from `@/lib/email`.
 *
 * The returned string is a full `<!DOCTYPE html>` document ready
 * to be sent via SendGrid or any email provider.
 */
export function buildEmail(template: EmailTemplate): string {
  const body = template.sections.map(renderSection).join("\n");

  return emailLayout({
    preheader: template.preheader,
    body,
    unsubscribeUrl: template.unsubscribeUrl,
    isTransactional: template.isTransactional,
  });
}

/**
 * Strip HTML from a built email to produce a plain-text version.
 *
 * Delegates to the existing `htmlToPlainText` function from
 * `@/lib/email` which handles link conversion, entity decoding,
 * and whitespace normalisation.
 */
export function generatePlainText(html: string): string {
  return htmlToPlainText(html);
}
