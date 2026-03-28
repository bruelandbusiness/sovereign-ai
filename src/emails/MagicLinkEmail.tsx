/**
 * Magic link (passwordless sign-in) email template using React Email.
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

export interface MagicLinkEmailProps {
  email: string;
  magicLinkUrl: string;
  expiresInMinutes?: number;
}

export function MagicLinkEmail({
  email: _email = "user@example.com",
  magicLinkUrl = "https://www.trysovereignai.com/auth/verify?token=example",
  expiresInMinutes = 15,
}: MagicLinkEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`Your secure sign-in link for Sovereign AI. Expires in ${expiresInMinutes} minutes.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            <Text style={heading}>Sign in to your dashboard</Text>
            <Text style={paragraph}>
              Click the button below to securely sign in. No password needed.
            </Text>

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={magicLinkUrl}>
                Sign In to Dashboard
              </Button>
            </Section>

            <Section style={infoCard}>
              <Text style={infoTitle}>Security info:</Text>
              <Text style={infoText}>
                &bull; This link expires in {expiresInMinutes} minutes
              </Text>
              <Text style={infoText}>
                &bull; It can only be used once
              </Text>
              <Text style={infoText}>
                &bull; If you didn&rsquo;t request this, safely ignore this
                email
              </Text>
            </Section>

            <Text style={mutedSmall}>
              If the button doesn&rsquo;t work, copy and paste this URL into
              your browser:
            </Text>
            <Text style={urlBox}>{magicLinkUrl}</Text>
          </Section>

          <Hr style={divider} />
          {footerSection({ isTransactional: true })}
        </Container>
      </Body>
    </Html>
  );
}

MagicLinkEmail.PreviewProps = {
  email: "user@example.com",
  magicLinkUrl: "https://www.trysovereignai.com/auth/verify?token=abc123",
  expiresInMinutes: 15,
} satisfies MagicLinkEmailProps;

export default MagicLinkEmail;

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
  color: BRAND.white,
  margin: "0 0 16px",
  lineHeight: "1.3",
  backgroundColor: BRAND.headerBg,
  padding: "24px 32px 0",
  marginLeft: "-32px",
  marginRight: "-32px",
  marginTop: "-32px",
  paddingBottom: "24px",
  marginBottom: "24px",
  fontFamily,
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: BRAND.text,
  margin: "0 0 16px",
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

const infoCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px 0",
};

const infoTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0 0 8px",
  fontFamily,
};

const infoText: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  lineHeight: "1.8",
  margin: "0",
  fontFamily,
};

const mutedSmall: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.muted,
  margin: "0 0 8px",
  fontFamily,
};

const urlBox: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "12px",
  color: BRAND.muted,
  wordBreak: "break-all",
  lineHeight: "1.5",
  margin: "0 0 16px",
  backgroundColor: BRAND.cardBgAlt,
  padding: "12px",
  borderRadius: "6px",
};

const divider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "0",
};
