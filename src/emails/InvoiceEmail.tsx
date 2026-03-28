/**
 * Invoice / payment confirmation email template using React Email.
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components";
import * as React from "react";

import {
  BRAND,
  fontFamily,
  logoSection,
  footerSection,
  accentBar,
} from "./shared-styles";

export interface InvoiceLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface InvoiceEmailProps {
  name: string;
  businessName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  paymentLast4?: string;
  billingUrl: string;
  paidAt?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function InvoiceEmail({
  name = "Jane",
  businessName = "Acme Plumbing",
  invoiceNumber = "INV-2026-0042",
  invoiceDate = "March 28, 2026",
  dueDate: _dueDate,
  lineItems = [
    { description: "Growth Plan (monthly)", amount: 499 },
    { description: "AI Chatbot Add-on", quantity: 1, unitPrice: 99, amount: 99 },
  ],
  subtotal = 598,
  tax = 0,
  total = 598,
  paymentMethod = "Visa",
  paymentLast4 = "4242",
  billingUrl = "https://www.trysovereignai.com/dashboard/billing",
  paidAt = "2026-03-28T10:00:00Z",
}: InvoiceEmailProps) {
  const isPaid = Boolean(paidAt);
  const paymentInfo = paymentLast4
    ? `${paymentMethod} ending in ${paymentLast4}`
    : paymentMethod;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isPaid
          ? `Payment of ${formatCurrency(total)} received for ${businessName}.`
          : `Invoice #${invoiceNumber} - ${formatCurrency(total)} for ${businessName}.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            {isPaid ? (
              <Section style={paidBanner}>
                <Text style={paidBannerText}>
                  Payment received &mdash; thank you!
                </Text>
              </Section>
            ) : null}

            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
              {isPaid
                ? <>Here&rsquo;s your payment receipt for <strong>{businessName}</strong>.</>
                : <>Here&rsquo;s your invoice for <strong>{businessName}</strong>.</>}
            </Text>

            {/* Invoice details card */}
            <Section style={invoiceCard}>
              {/* Header row */}
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%", marginBottom: "20px" }}
              >
                <tbody>
                  <tr>
                    <td>
                      <Text style={labelSmall}>Invoice Number</Text>
                      <Text style={valueMain}>#{invoiceNumber}</Text>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Text style={labelSmall}>Date</Text>
                      <Text style={valueMain}>{invoiceDate}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Line items */}
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%" }}
              >
                <thead>
                  <tr>
                    <td style={tableHeader}>Description</td>
                    <td style={{ ...tableHeader, textAlign: "right" }}>
                      Amount
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i}>
                      <td style={lineItemCell}>
                        {item.description}
                        {item.quantity != null && item.unitPrice != null ? (
                          <br />
                        ) : null}
                        {item.quantity != null && item.unitPrice != null ? (
                          <span style={lineItemDetail}>
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </span>
                        ) : null}
                      </td>
                      <td style={lineItemAmount}>
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%", marginTop: "12px" }}
              >
                <tbody>
                  <tr>
                    <td style={totalLabel}>Subtotal</td>
                    <td style={totalValue}>{formatCurrency(subtotal)}</td>
                  </tr>
                  {tax != null && tax > 0 ? (
                    <tr>
                      <td style={totalLabel}>Tax</td>
                      <td style={totalValue}>{formatCurrency(tax)}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <td style={grandTotalLabel}>Total</td>
                    <td style={grandTotalValue}>{formatCurrency(total)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Payment method */}
              <Section style={paymentMethodBox}>
                <Text style={labelSmall}>Payment Method</Text>
                <Text style={paymentMethodText}>{paymentInfo}</Text>
              </Section>
            </Section>

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={billingUrl}>
                View Billing Details
              </Button>
            </Section>

            <Text style={mutedSmallCenter}>
              This is an automated receipt. If you have questions about this
              charge, reply to this email or visit your billing page.
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({ isTransactional: true })}
        </Container>
      </Body>
    </Html>
  );
}

InvoiceEmail.PreviewProps = {
  name: "Jane",
  businessName: "Acme Plumbing",
  invoiceNumber: "INV-2026-0042",
  invoiceDate: "March 28, 2026",
  lineItems: [
    { description: "Growth Plan (monthly)", amount: 499 },
    { description: "AI Chatbot Add-on", quantity: 1, unitPrice: 99, amount: 99 },
  ],
  subtotal: 598,
  tax: 0,
  total: 598,
  paymentMethod: "Visa",
  paymentLast4: "4242",
  billingUrl: "https://www.trysovereignai.com/dashboard/billing",
  paidAt: "2026-03-28T10:00:00Z",
} satisfies InvoiceEmailProps;

export default InvoiceEmail;

// ── Styles ──────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: BRAND.pageBg,
  margin: 0,
  padding: 0,
  fontFamily,
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: BRAND.headerBg,
  borderRadius: "12px",
  overflow: "hidden",
};

const content: React.CSSProperties = {
  backgroundColor: BRAND.cardBg,
  padding: "32px 32px 40px",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: BRAND.text,
  margin: "0 0 16px",
  fontFamily,
};

const paidBanner: React.CSSProperties = {
  backgroundColor: "#10b98115",
  border: `1px solid ${BRAND.accent}33`,
  borderRadius: "8px",
  padding: "14px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const paidBannerText: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.accent,
  margin: "0",
  fontFamily,
};

const invoiceCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const labelSmall: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 2px",
  fontFamily,
};

const valueMain: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0",
  fontFamily,
};

const tableHeader: React.CSSProperties = {
  padding: "8px 0",
  borderBottom: `2px solid ${BRAND.border}`,
  fontSize: "11px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  fontFamily,
};

const lineItemCell: React.CSSProperties = {
  padding: "12px 0",
  borderBottom: `1px solid ${BRAND.border}`,
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "1.4",
  fontFamily,
};

const lineItemDetail: React.CSSProperties = {
  color: BRAND.muted,
  fontSize: "12px",
};

const lineItemAmount: React.CSSProperties = {
  padding: "12px 0",
  borderBottom: `1px solid ${BRAND.border}`,
  fontSize: "14px",
  color: BRAND.text,
  textAlign: "right" as const,
  whiteSpace: "nowrap" as const,
  fontFamily,
};

const totalLabel: React.CSSProperties = {
  padding: "8px 0",
  fontSize: "14px",
  color: BRAND.muted,
  fontFamily,
};

const totalValue: React.CSSProperties = {
  padding: "8px 0",
  fontSize: "14px",
  color: BRAND.muted,
  textAlign: "right" as const,
  fontFamily,
};

const grandTotalLabel: React.CSSProperties = {
  padding: "12px 0 0",
  borderTop: `2px solid ${BRAND.border}`,
  fontSize: "18px",
  fontWeight: 700,
  color: BRAND.text,
  fontFamily,
};

const grandTotalValue: React.CSSProperties = {
  padding: "12px 0 0",
  borderTop: `2px solid ${BRAND.border}`,
  fontSize: "18px",
  fontWeight: 700,
  color: BRAND.text,
  textAlign: "right" as const,
  fontFamily,
};

const paymentMethodBox: React.CSSProperties = {
  marginTop: "20px",
  padding: "12px 16px",
  backgroundColor: BRAND.cardBg,
  borderRadius: "8px",
};

const paymentMethodText: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  margin: "0",
  fontFamily,
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const ctaButton: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: BRAND.accent,
  color: BRAND.white,
  padding: "14px 36px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "16px",
  fontFamily,
  lineHeight: "1",
};

const mutedSmallCenter: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.muted,
  textAlign: "center" as const,
  margin: "0",
  fontFamily,
};

const footerDivider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "0",
};
