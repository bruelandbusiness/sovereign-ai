/**
 * Shared constants, layout, and reusable components for email templates.
 *
 * All template files import from this module rather than duplicating brand
 * constants or layout markup.
 */

import { escapeHtml, safeHttpUrl } from "@/lib/email";

// ─── Brand Constants ────────────────────────────────────────────────────────

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";
export const FROM_NAME = "Sovereign AI";
export const BRAND = {
  /** Dark navy used in the header background */
  headerBg: "#0a0a1a",
  /** Header gradient accent bar */
  accentGradient: "linear-gradient(135deg, #4c85ff, #22d3a1)",
  /** Primary CTA blue */
  primary: "#4c85ff",
  /** Secondary CTA green */
  secondary: "#22d3a1",
  /** Danger / urgency red */
  danger: "#ef4444",
  /** Warning amber */
  warning: "#f59e0b",
  /** Star gold for review requests */
  gold: "#fbbf24",
  /** Body text */
  text: "#333333",
  /** Muted / secondary text */
  muted: "#666666",
  /** Light muted text */
  light: "#999999",
  /** Card backgrounds */
  cardBg: "#f8f9fa",
  /** Separator lines */
  border: "#e9ecef",
  /** Page background */
  pageBg: "#f4f4f5",
  /** White */
  white: "#ffffff",
} as const;

export const COMPANY_ADDRESS =
  process.env.COMPANY_ADDRESS ||
  "123 Main Street, Suite 100, Austin, TX 78701";

// ─── Base Layout ────────────────────────────────────────────────────────────

export function brandedHeader(): string {
  return `
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td><![endif]-->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">
  <tr>
    <td style="background:${BRAND.headerBg};padding:0;">
      <!-- Accent gradient bar -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="height:4px;background:${BRAND.accentGradient};background-color:${BRAND.primary};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
      <!-- Logo area -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding:28px 32px;text-align:center;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
              <tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:${BRAND.white};letter-spacing:0.5px;">
                  Sovereign AI
                </td>
              </tr>
              <tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${BRAND.light};letter-spacing:1.5px;text-transform:uppercase;text-align:center;padding-top:4px;">
                  AI-Powered Marketing
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->`;
}

export function brandedFooter(opts: {
  unsubscribeUrl?: string;
  isTransactional?: boolean;
}): string {
  const unsub = opts.unsubscribeUrl && !opts.isTransactional
    ? `<tr>
        <td style="padding:0 0 12px;text-align:center;">
          <a href="${safeHttpUrl(opts.unsubscribeUrl)}" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.light};text-decoration:underline;">Unsubscribe</a>
        </td>
      </tr>`
    : "";

  return `
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td><![endif]-->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">
  <tr>
    <td style="padding:32px 32px 16px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="height:1px;background:${BRAND.border};font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px;text-align:center;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 auto;">
        <tr>
          <td style="padding:0 0 8px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:${BRAND.text};">
            Sovereign AI
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 8px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.light};">
            AI-Powered Marketing for Local Businesses
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 12px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${BRAND.light};">
            ${escapeHtml(COMPANY_ADDRESS)}
          </td>
        </tr>
        ${unsub}
      </table>
    </td>
  </tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->`;
}

/**
 * Wraps email body content in the full branded layout.
 * This is the single source of truth for all transactional emails.
 */
export function baseLayout(opts: {
  preheader?: string;
  body: string;
  unsubscribeUrl?: string;
  isTransactional?: boolean;
}): string {
  const preheaderHtml = opts.preheader
    ? `<div style="display:none;font-size:1px;color:${BRAND.pageBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(opts.preheader)}${"&zwnj;&nbsp;".repeat(30)}</div>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${FROM_NAME}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    /* Mobile */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .stack-column-center { text-align: center !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
      .mobile-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheaderHtml}

  <!-- Full-width background wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${BRAND.pageBg};">
    <tr>
      <td style="padding:24px 0;">

        ${brandedHeader()}

        <!-- Body content -->
        <!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td><![endif]-->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-container" style="max-width:600px;margin:0 auto;background-color:${BRAND.white};">
          <tr>
            <td style="padding:32px 32px 40px;" class="mobile-padding">
              ${opts.body}
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->

        ${brandedFooter({ unsubscribeUrl: opts.unsubscribeUrl, isTransactional: opts.isTransactional })}

      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Reusable Components ────────────────────────────────────────────────────

export function ctaButton(
  text: string,
  url: string,
  variant: "primary" | "secondary" | "danger" | "gold" = "primary"
): string {
  const bgMap = {
    primary: BRAND.primary,
    secondary: BRAND.secondary,
    danger: BRAND.danger,
    gold: BRAND.gold,
  };
  const textColorMap = {
    primary: BRAND.white,
    secondary: BRAND.white,
    danger: BRAND.white,
    gold: "#1a1a1a",
  };
  const bg = bgMap[variant];
  const textColor = textColorMap[variant];
  const safeUrl = safeHttpUrl(url);

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="padding:28px 0;text-align:center;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%" strokecolor="${bg}" fillcolor="${bg}">
        <w:anchorlock/>
        <center style="color:${textColor};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${escapeHtml(text)}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeUrl}" style="display:inline-block;background-color:${bg};color:${textColor};padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1;mso-hide:all;">
        ${escapeHtml(text)}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

export function paragraph(text: string, opts?: { muted?: boolean; small?: boolean; bold?: boolean; center?: boolean }): string {
  const color = opts?.muted ? BRAND.muted : BRAND.text;
  const size = opts?.small ? "14px" : "16px";
  const weight = opts?.bold ? "font-weight:600;" : "";
  const align = opts?.center ? "text-align:center;" : "";
  return `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${size};line-height:1.6;color:${color};margin:0 0 16px;${weight}${align}">${text}</p>`;
}

export function heading(text: string, level: 1 | 2 | 3 = 2): string {
  const sizes = { 1: "24px", 2: "20px", 3: "16px" };
  return `<h${level} style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${sizes[level]};font-weight:700;color:${BRAND.headerBg};margin:0 0 16px;line-height:1.3;">${text}</h${level}>`;
}

export function statCard(stats: Array<{ label: string; value: string; color?: string }>): string {
  const cols = stats.map((s) => {
    const color = s.color || BRAND.primary;
    const width = Math.floor(100 / stats.length);
    return `<td align="center" width="${width}%" style="padding:12px 8px;" class="stack-column">
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:28px;font-weight:700;color:${color};margin:0;line-height:1;">${escapeHtml(s.value)}</p>
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.muted};margin:6px 0 0;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(s.label)}</p>
    </td>`;
  }).join("");

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
  <tr>
    <td style="background:${BRAND.cardBg};border-radius:12px;padding:8px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>${cols}</tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function infoCard(content: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
  <tr>
    <td style="background:${BRAND.cardBg};border-radius:12px;padding:24px;">
      ${content}
    </td>
  </tr>
</table>`;
}

export function accentCard(content: string, borderColor: string = BRAND.primary): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
  <tr>
    <td style="border-left:4px solid ${borderColor};background:#f0f4ff;border-radius:0 8px 8px 0;padding:16px 20px;">
      ${content}
    </td>
  </tr>
</table>`;
}

export function divider(): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
  <tr><td style="height:1px;background:${BRAND.border};font-size:0;line-height:0;">&nbsp;</td></tr>
</table>`;
}

export function stepList(steps: Array<{ number: string; title: string; description: string }>): string {
  const rows = steps.map((s) => `
    <tr>
      <td style="padding:12px 0;vertical-align:top;" width="48">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background:${BRAND.primary};color:${BRAND.white};width:32px;height:32px;border-radius:50%;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;line-height:32px;">
              ${escapeHtml(s.number)}
            </td>
          </tr>
        </table>
      </td>
      <td style="padding:12px 0 12px 12px;vertical-align:top;">
        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:${BRAND.text};margin:0 0 4px;">${escapeHtml(s.title)}</p>
        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};margin:0;line-height:1.5;">${escapeHtml(s.description)}</p>
      </td>
    </tr>`).join("");

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
  ${rows}
</table>`;
}

// ─── Currency Formatter ─────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
