/**
 * Lead notification email — notifies business owner of a new lead.
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

export interface LeadNotificationEmailProps {
  name: string;
  businessName: string;
  leadName: string;
  leadPhone?: string;
  leadEmail?: string;
  leadSource: string;
  leadService?: string;
  leadMessage?: string;
  dashboardUrl: string;
  timestamp: string;
}

export function LeadNotificationEmail({
  name = "Jane",
  businessName = "Acme Plumbing",
  leadName = "John Smith",
  leadPhone = "(555) 123-4567",
  leadEmail = "john@example.com",
  leadSource = "Website Chatbot",
  leadService = "Emergency Plumbing",
  leadMessage = "I have a leaky faucet that needs urgent repair. Available any time this week.",
  dashboardUrl = "https://www.trysovereignai.com/dashboard/leads",
  timestamp = "March 28, 2026, 2:34 PM",
}: LeadNotificationEmailProps) {
  const detailRows: Array<{ label: string; value: string; href?: string }> = [];

  if (leadPhone) {
    detailRows.push({
      label: "Phone",
      value: leadPhone,
      href: `tel:${leadPhone}`,
    });
  }
  if (leadEmail) {
    detailRows.push({
      label: "Email",
      value: leadEmail,
      href: `mailto:${leadEmail}`,
    });
  }
  detailRows.push({ label: "Source", value: leadSource });
  if (leadService) {
    detailRows.push({ label: "Service", value: leadService });
  }
  detailRows.push({ label: "Time", value: timestamp });

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        New lead from {leadSource}: {leadName}. Respond quickly!
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            {/* Alert banner */}
            <Section style={alertBanner}>
              <Text style={alertBannerText}>New Lead Just Came In!</Text>
            </Section>

            <Text style={paragraph}>
              Hi {name}, a new lead just submitted their information for{" "}
              <strong>{businessName}</strong>.
            </Text>

            {/* Lead details card */}
            <Section style={leadCard}>
              <Text style={leadNameStyle}>{leadName}</Text>

              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%" }}
              >
                <tbody>
                  {detailRows.map((row) => (
                    <tr key={row.label}>
                      <td style={detailLabelCell}>{row.label}</td>
                      <td style={detailValueCell}>
                        {row.href ? (
                          <Link href={row.href} style={detailLink}>
                            {row.value}
                          </Link>
                        ) : (
                          row.value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {leadMessage ? (
                <>
                  <Hr style={cardDivider} />
                  <Text style={messageLabelStyle}>Message</Text>
                  <Text style={messageBox}>{leadMessage}</Text>
                </>
              ) : null}
            </Section>

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={dashboardUrl}>
                View in Dashboard
              </Button>
            </Section>

            <Text style={mutedSmallCenter}>
              Responding within 5 minutes increases conversion by 400%. The
              faster you reach out, the better your chances.
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({ isTransactional: true })}
        </Container>
      </Body>
    </Html>
  );
}

LeadNotificationEmail.PreviewProps = {
  name: "Jane",
  businessName: "Acme Plumbing",
  leadName: "John Smith",
  leadPhone: "(555) 123-4567",
  leadEmail: "john@example.com",
  leadSource: "Website Chatbot",
  leadService: "Emergency Plumbing",
  leadMessage:
    "I have a leaky faucet that needs urgent repair. Available any time this week.",
  dashboardUrl: "https://www.trysovereignai.com/dashboard/leads",
  timestamp: "March 28, 2026, 2:34 PM",
} satisfies LeadNotificationEmailProps;

export default LeadNotificationEmail;

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

const alertBanner: React.CSSProperties = {
  backgroundColor: "#10b98115",
  border: `1px solid ${BRAND.accent}33`,
  borderRadius: "8px",
  padding: "14px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const alertBannerText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: BRAND.accent,
  margin: "0",
  fontFamily,
};

const leadCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "24px",
  margin: "20px 0",
};

const leadNameStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: BRAND.text,
  margin: "0 0 16px",
  lineHeight: "1.3",
  fontFamily,
};

const detailLabelCell: React.CSSProperties = {
  padding: "8px 0",
  borderBottom: `1px solid ${BRAND.border}`,
  fontSize: "13px",
  color: BRAND.muted,
  width: "100px",
  fontFamily,
};

const detailValueCell: React.CSSProperties = {
  padding: "8px 0",
  borderBottom: `1px solid ${BRAND.border}`,
  fontSize: "14px",
  color: BRAND.text,
  fontWeight: 600,
  fontFamily,
};

const detailLink: React.CSSProperties = {
  color: BRAND.accent,
  textDecoration: "none",
};

const cardDivider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "16px 0",
};

const messageLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
  fontFamily,
};

const messageBox: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "1.6",
  margin: "0",
  backgroundColor: BRAND.cardBg,
  padding: "12px 16px",
  borderRadius: "8px",
  border: `1px solid ${BRAND.border}`,
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
