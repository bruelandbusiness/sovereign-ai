/**
 * Onboarding complete email — sent when all AI services are live and
 * configured for the business.
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

export interface OnboardingCompleteEmailProps {
  name: string;
  businessName: string;
  dashboardUrl: string;
  activatedServices: string[];
  nextSteps: Array<{ title: string; description: string }>;
}

export function OnboardingCompleteEmail({
  name = "Jane",
  businessName = "Acme Plumbing",
  dashboardUrl = "https://www.trysovereignai.com/dashboard",
  activatedServices = [
    "AI Chatbot",
    "AI Phone Receptionist",
    "Review Management",
    "CRM with Lead Scoring",
    "Analytics Dashboard",
  ],
  nextSteps = [
    {
      title: "Check your dashboard",
      description:
        "Your real-time analytics are already collecting data. Visit your dashboard to see incoming leads and performance metrics.",
    },
    {
      title: "Test your AI chatbot",
      description:
        "Visit your website and try chatting with your AI assistant. It knows your services, pricing, and availability.",
    },
    {
      title: "Share your review link",
      description:
        "Start collecting reviews by sharing your custom review link with recent customers.",
    },
    {
      title: "Invite your team",
      description:
        "Add team members so they can respond to leads and manage bookings from the dashboard.",
    },
  ],
}: OnboardingCompleteEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your AI services for {businessName} are now live! Here&rsquo;s what to do next.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            {/* Success banner */}
            <Section style={successBanner}>
              <Text style={successBannerText}>
                Your AI Services Are Live!
              </Text>
            </Section>

            <Text style={heading}>
              Congratulations, {name}!
            </Text>
            <Text style={paragraph}>
              All AI-powered marketing services for{" "}
              <strong>{businessName}</strong> have been configured and are now
              running. Your business is officially powered by AI.
            </Text>

            {/* Activated services card */}
            <Section style={servicesCard}>
              <Text style={servicesTitle}>Activated Services</Text>
              {activatedServices.map((service) => (
                <Text key={service} style={serviceItem}>
                  &#x2705; {service}
                </Text>
              ))}
            </Section>

            {/* Next steps */}
            <Text style={subheading}>What to Do Next</Text>

            {nextSteps.map((step, i) => (
              <Section key={i} style={stepRow}>
                <table
                  role="presentation"
                  cellSpacing={0}
                  cellPadding={0}
                  style={{ width: "100%" }}
                >
                  <tbody>
                    <tr>
                      <td style={stepNumCell}>
                        <Text style={stepNum}>{i + 1}</Text>
                      </td>
                      <td style={stepContentCell}>
                        <Text style={stepTitle}>{step.title}</Text>
                        <Text style={stepDesc}>{step.description}</Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Section>
            ))}

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={dashboardUrl}>
                Go to Your Dashboard
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={mutedSmall}>
              Your AI systems are now working around the clock. You&rsquo;ll
              receive weekly performance reports every Monday. Need help?
              Reply to this email anytime.
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({ isTransactional: true })}
        </Container>
      </Body>
    </Html>
  );
}

OnboardingCompleteEmail.PreviewProps = {
  name: "Jane",
  businessName: "Acme Plumbing",
  dashboardUrl: "https://www.trysovereignai.com/dashboard",
  activatedServices: [
    "AI Chatbot",
    "AI Phone Receptionist",
    "Review Management",
    "CRM with Lead Scoring",
    "Analytics Dashboard",
  ],
  nextSteps: [
    {
      title: "Check your dashboard",
      description:
        "Your real-time analytics are already collecting data. Visit your dashboard to see incoming leads and performance metrics.",
    },
    {
      title: "Test your AI chatbot",
      description:
        "Visit your website and try chatting with your AI assistant. It knows your services, pricing, and availability.",
    },
    {
      title: "Share your review link",
      description:
        "Start collecting reviews by sharing your custom review link with recent customers.",
    },
    {
      title: "Invite your team",
      description:
        "Add team members so they can respond to leads and manage bookings from the dashboard.",
    },
  ],
} satisfies OnboardingCompleteEmailProps;

export default OnboardingCompleteEmail;

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

const successBanner: React.CSSProperties = {
  backgroundColor: "#10b98115",
  border: `1px solid ${BRAND.accent}33`,
  borderRadius: "8px",
  padding: "14px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const successBannerText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: BRAND.accent,
  margin: "0",
  fontFamily,
};

const servicesCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px 0",
};

const servicesTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 12px",
  fontFamily,
};

const serviceItem: React.CSSProperties = {
  fontSize: "15px",
  color: BRAND.text,
  margin: "0 0 6px",
  lineHeight: "1.5",
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
