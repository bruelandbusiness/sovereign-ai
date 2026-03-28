/**
 * Welcome email template for new user onboarding using React Email.
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

export interface WelcomeEmailProps {
  name: string;
  businessName: string;
  dashboardUrl: string;
  trialDays?: number;
}

export function WelcomeEmail({
  name = "Jane",
  businessName = "Acme Plumbing",
  dashboardUrl = "https://www.trysovereignai.com/dashboard",
  trialDays = 14,
}: WelcomeEmailProps) {
  const features = [
    "AI Chatbot (50 conversations/month)",
    "CRM with AI lead scoring (50 leads)",
    "Analytics dashboard (read-only)",
    "24/7 AI-powered support",
  ];

  const steps = [
    {
      num: "1",
      title: "Your dashboard is live",
      desc: "Access real-time analytics, lead tracking, and service controls right now.",
    },
    {
      num: "2",
      title: "AI services activating",
      desc: "Your AI chatbot, CRM, and analytics are being configured for your business.",
    },
    {
      num: "3",
      title: "First results within days",
      desc: "Most businesses see their first AI-generated leads within 7 days.",
    },
  ];

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`Welcome, ${name}! Your ${trialDays}-day free trial for ${businessName} is now active.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            <Text style={heading}>Welcome aboard, {name}!</Text>
            <Text style={paragraph}>
              Your AI marketing engine for <strong>{businessName}</strong> is
              being activated right now. You have{" "}
              <strong>{trialDays} days</strong> of full access to see what
              AI-powered marketing can do for your business.
            </Text>

            <Text style={subheading}>Here&rsquo;s what happens next:</Text>

            {steps.map((step) => (
              <Section key={step.num} style={stepRow}>
                <table
                  role="presentation"
                  cellSpacing={0}
                  cellPadding={0}
                  style={{ width: "100%" }}
                >
                  <tbody>
                    <tr>
                      <td style={stepNumCell}>
                        <Text style={stepNum}>{step.num}</Text>
                      </td>
                      <td style={stepContentCell}>
                        <Text style={stepTitle}>{step.title}</Text>
                        <Text style={stepDesc}>{step.desc}</Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Section>
            ))}

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={dashboardUrl}>
                Open Your Dashboard
              </Button>
            </Section>

            <Section style={featureCard}>
              <Text style={featureCardTitle}>
                What&rsquo;s included in your trial
              </Text>
              {features.map((feature) => (
                <Text key={feature} style={featureItem}>
                  &#x2713; {feature}
                </Text>
              ))}
            </Section>

            <Hr style={divider} />

            <Text style={mutedSmall}>
              Need help getting started? Reply to this email anytime &mdash; a
              real human will respond.
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({ isTransactional: true })}
        </Container>
      </Body>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Jane",
  businessName: "Acme Plumbing",
  dashboardUrl: "https://www.trysovereignai.com/dashboard",
  trialDays: 14,
} satisfies WelcomeEmailProps;

export default WelcomeEmail;

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

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: BRAND.accent,
  margin: "0 0 16px",
  lineHeight: "1.3",
  fontFamily,
};

const subheading: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: BRAND.text,
  margin: "24px 0 16px",
  lineHeight: "1.3",
  fontFamily,
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: BRAND.text,
  margin: "0 0 16px",
  fontFamily,
};

const stepRow: React.CSSProperties = {
  margin: "0 0 4px",
};

const stepNumCell: React.CSSProperties = {
  width: "40px",
  verticalAlign: "top",
  paddingTop: "12px",
  paddingRight: "12px",
};

const stepNum: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  backgroundColor: BRAND.accent,
  color: BRAND.white,
  textAlign: "center" as const,
  lineHeight: "32px",
  fontSize: "14px",
  fontWeight: 700,
  margin: "0",
  fontFamily,
};

const stepContentCell: React.CSSProperties = {
  verticalAlign: "top",
  paddingTop: "12px",
};

const stepTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0 0 4px",
  fontFamily,
};

const stepDesc: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.muted,
  margin: "0 0 12px",
  lineHeight: "1.5",
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

const featureCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px 0",
};

const featureCardTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 12px",
  fontFamily,
};

const featureItem: React.CSSProperties = {
  fontSize: "15px",
  color: BRAND.text,
  margin: "0 0 6px",
  lineHeight: "1.5",
  fontFamily,
};

const mutedSmall: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.muted,
  margin: "0",
  fontFamily,
};

const divider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "24px 0",
};

const footerDivider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "0",
};
