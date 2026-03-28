/**
 * Invoice / payment receipt email template.
 */

import { escapeHtml } from "@/lib/email";
import {
  baseLayout,
  paragraph,
  ctaButton,
  formatCurrency,
  BRAND,
} from "./shared";

export interface InvoiceVars {
  name: string;
  businessName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  lineItems: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  paymentLast4?: string;
  billingUrl: string;
  paidAt?: string;
}

export function buildInvoice(vars: InvoiceVars): { subject: string; html: string } {
  const safeName = escapeHtml(vars.name);
  const safeBusiness = escapeHtml(vars.businessName);
  const isPaid = !!vars.paidAt;

  const subject = isPaid
    ? `Payment receipt for ${escapeHtml(vars.businessName)} — ${formatCurrency(vars.total)}`
    : `Invoice #${escapeHtml(vars.invoiceNumber)} for ${escapeHtml(vars.businessName)}`;

  const lineItemRows = vars.lineItems.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};line-height:1.4;">
        ${escapeHtml(item.description)}
        ${item.quantity && item.unitPrice ? `<br/><span style="color:${BRAND.muted};font-size:12px;">${item.quantity} x ${formatCurrency(item.unitPrice)}</span>` : ""}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};text-align:right;white-space:nowrap;">
        ${formatCurrency(item.amount)}
      </td>
    </tr>`).join("");

  const taxRow = vars.tax != null
    ? `<tr>
        <td style="padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};">Tax</td>
        <td style="padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};text-align:right;">${formatCurrency(vars.tax)}</td>
      </tr>`
    : "";

  const paymentInfo = vars.paymentLast4
    ? `${escapeHtml(vars.paymentMethod)} ending in ${escapeHtml(vars.paymentLast4)}`
    : escapeHtml(vars.paymentMethod);

  const body = `
    ${isPaid
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
          <tr>
            <td style="background:${BRAND.secondary}15;border:1px solid ${BRAND.secondary}33;border-radius:8px;padding:14px 20px;text-align:center;">
              <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${BRAND.secondary};margin:0;">Payment received — thank you!</p>
            </td>
          </tr>
        </table>`
      : ""
    }

    ${paragraph(`Hi ${safeName},`)}
    ${paragraph(isPaid
      ? `Here&rsquo;s your payment receipt for <strong>${safeBusiness}</strong>.`
      : `Here&rsquo;s your invoice for <strong>${safeBusiness}</strong>.`
    )}

    <!-- Invoice details card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;background:${BRAND.cardBg};border-radius:12px;">
      <tr>
        <td style="padding:24px;">
          <!-- Invoice header -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
            <tr>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <p style="font-size:12px;color:${BRAND.muted};margin:0 0 2px;text-transform:uppercase;letter-spacing:0.5px;">Invoice Number</p>
                <p style="font-size:16px;font-weight:600;color:${BRAND.text};margin:0;">#${escapeHtml(vars.invoiceNumber)}</p>
              </td>
              <td style="text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <p style="font-size:12px;color:${BRAND.muted};margin:0 0 2px;text-transform:uppercase;letter-spacing:0.5px;">Date</p>
                <p style="font-size:16px;color:${BRAND.text};margin:0;">${escapeHtml(vars.invoiceDate)}</p>
              </td>
            </tr>
          </table>

          <!-- Line items -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding:8px 0;border-bottom:2px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;">Description</td>
              <td style="padding:8px 0;border-bottom:2px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Amount</td>
            </tr>
            ${lineItemRows}
          </table>

          <!-- Totals -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:12px;">
            <tr>
              <td style="padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};">Subtotal</td>
              <td style="padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};text-align:right;">${formatCurrency(vars.subtotal)}</td>
            </tr>
            ${taxRow}
            <tr>
              <td style="padding:12px 0 0;border-top:2px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:${BRAND.text};">Total</td>
              <td style="padding:12px 0 0;border-top:2px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:${BRAND.text};text-align:right;">${formatCurrency(vars.total)}</td>
            </tr>
          </table>

          <!-- Payment method -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
            <tr>
              <td style="padding:12px 16px;background:${BRAND.white};border-radius:8px;">
                <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.muted};margin:0 0 2px;text-transform:uppercase;letter-spacing:0.5px;">Payment Method</p>
                <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.text};margin:0;">${paymentInfo}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("View Billing Details", vars.billingUrl)}

    ${paragraph("This is an automated receipt. If you have questions about this charge, reply to this email or visit your billing page.", { muted: true, small: true, center: true })}
  `;

  return {
    subject,
    html: baseLayout({
      preheader: isPaid
        ? `Payment of ${formatCurrency(vars.total)} received for ${escapeHtml(vars.businessName)}.`
        : `Invoice #${escapeHtml(vars.invoiceNumber)} — ${formatCurrency(vars.total)} for ${escapeHtml(vars.businessName)}.`,
      body,
      isTransactional: true,
    }),
  };
}
