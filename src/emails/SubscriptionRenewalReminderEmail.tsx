/**
 * Subscription renewal reminder email — warns the business owner their
 * plan is about to renew.
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
  Link,
} from "@react-email/components";
import * as React from "react";

import {
  BRAND,
  fontFamily,
  logoSection,
  footerSection,
  accentBar,
} from "./shared-styles";

export interface SubscriptionRenewalReminderEmailProps {
  name: string;
  businessName: string;
  planName: string;
  renewalDate: string;
  amount: number;
  billingCycle: string;
  paymentMethod: string;
  paymentLast4?: string;
  billingUrl: string;
  daysUntilRenewal: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function SubscriptionRenewalReminderEmail({
  name = "Jane",
  businessName = "Acme Plumbing",
  planName = "Growth Plan",
  renewalDate = "March 31, 2026",
  amount = 499,
  billingCycle = "monthly",
  paymentMethod = "Visa",
  paymentLast4 = "4242",
  billingUrl = "https://www.trysovereignai.com/dashboard/billing",
  daysUntilRenewal = 3,
}: SubscriptionRenewalReminderEmailProps) {
  const paymentInfo = paymentLast4
    ? `${paymentMethod} ending in ${paymentLast4}`
    : paymentMethod;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`Your ${planName} renews in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? "s" : ""} \u2014 ${formatCurrency(amount)}/${billingCycle}.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            <Section style={reminderBanner}>
              <Text style={reminderBannerText}>
                {`Renewal in ${daysUntilRenewal} Day${daysUntilRenewal !== 1 ? "s" : ""}`}
              </Text>
            </Section>

            <Text style={paragraph}>
              Hi {name}, this is a friendly reminder that your subscription for{" "}
              <strong>{businessName}</strong> will automatically renew soon.
            </Text>

            {/* Plan details card */}
            <Section style={planCard}>
              <Text style={planNameStyle}>{planName}</Text>

              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td style={detailLabel}>Amount</td>
                    <td style={detailValue}>
                      {formatCurrency(amount)}/{billingCycle}
                    </td>
                  </tr>
                  <tr>
                    <td style={detailLabel}>Renewal Date</td>
                    <td style={detailValue}>{renewalDate}</td>
                  </tr>
                  <tr>
                    <td style={detailLabelLast}>Payment Method</td>
                    <td style={detailValueLast}>{paymentInfo}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Text style={paragraph}>
              No action is needed if you&rsquo;d like to continue. Your plan
              will renew automatically and your AI services will continue
              without interruption.
            </Text>

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={billingUrl}>
                Manage Subscription
              </Button>
            </Section>

            <Text style={mutedSmallCenter}>
              Need to update your payment method or change plans?{" "}
              <Link href={billingUrl} style={inlineLink}>
                Visit your billing page
              </Link>
              .
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({ isTransactional: true })}
        </Container>
      </Body>
    </Html>
  );
}

SubscriptionRenewalReminderEmail.PreviewProps = {
  name: "Jane",
  businessName: "Acme Plumbing",
  planName: "Growth Plan",
  renewalDate: "March 31, 2026",
  amount: 499,
  billingCycle: "monthly",
  paymentMethod: "Visa",
  paymentLast4: "4242",
  billingUrl: "https://www.trysovereignai.com/dashboard/billing",
  daysUntilRenewal: 3,
} satisfies SubscriptionRenewalReminderEmailProps;

export default SubscriptionRenewalReminderEmail;

// -- Styles ----------------------------------------------------------------

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

const reminderBanner: React.CSSProperties = {
  backgroundColor: "#f59e0b15",
  border: `1px solid ${BRAND.warning}33`,
  borderRadius: "8px",
  padding: "14px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const reminderBannerText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: BRAND.warning,
  margin: "0",
  fontFamily,
};

const planCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "24px",
  margin: "20px 0",
};

const planNameStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: BRAND.text,
  margin: "0 0 16px",
  lineHeight: "1.3",
  fontFamily,
};

const detailLabel: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: `1px solid ${BRAND.border}`,
  fontSize: "13px",
  color: BRAND.muted,
  width: "140px",
  fontFamily,
};

const detailValue: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: `1px solid ${BRAND.border}`,
  fontSize: "14px",
  color: BRAND.text,
  fontWeight: 600,
  textAlign: "right" as const,
  fontFamily,
};

const detailLabelLast: React.CSSProperties = {
  padding: "10px 0",
  fontSize: "13px",
  color: BRAND.muted,
  width: "140px",
  fontFamily,
};

const detailValueLast: React.CSSProperties = {
  padding: "10px 0",
  fontSize: "14px",
  color: BRAND.text,
  fontWeight: 600,
  textAlign: "right" as const,
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

const inlineLink: React.CSSProperties = {
  color: BRAND.accent,
  textDecoration: "underline",
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
