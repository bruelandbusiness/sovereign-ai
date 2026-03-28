/**
 * Magic link (passwordless sign-in) email template.
 */

import { escapeHtml } from "@/lib/email";
import {
  baseLayout,
  heading,
  paragraph,
  ctaButton,
  infoCard,
  BRAND,
} from "./shared";

export interface MagicLinkVars {
  email: string;
  magicLinkUrl: string;
  expiresInMinutes?: number;
}

export function buildMagicLink(vars: MagicLinkVars): { subject: string; html: string } {
  const expires = vars.expiresInMinutes ?? 15;

  const subject = "Sign in to Sovereign AI";

  const body = `
    ${heading("Sign in to your dashboard")}
    ${paragraph("Click the button below to securely sign in. No password needed.")}

    ${ctaButton("Sign In to Dashboard", vars.magicLinkUrl)}

    ${infoCard(`
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.muted};line-height:1.6;">
            <strong style="color:${BRAND.text};">Security info:</strong><br/>
            &#x2022; This link expires in ${expires} minutes<br/>
            &#x2022; It can only be used once<br/>
            &#x2022; If you didn&rsquo;t request this, safely ignore this email
          </td>
        </tr>
      </table>
    `)}

    ${paragraph("If the button doesn&rsquo;t work, copy and paste this URL into your browser:", { muted: true, small: true })}
    <p style="font-family:monospace;font-size:12px;color:${BRAND.muted};word-break:break-all;line-height:1.5;margin:0 0 16px;background:${BRAND.cardBg};padding:12px;border-radius:6px;">${escapeHtml(vars.magicLinkUrl)}</p>
  `;

  return {
    subject,
    html: baseLayout({
      preheader: "Your secure sign-in link for Sovereign AI. Expires in " + expires + " minutes.",
      body,
      isTransactional: true,
    }),
  };
}
