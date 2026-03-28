/**
 * Review request email asking a customer to leave a review after their
 * appointment. Uses the shared dark-theme brand layout.
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
  APP_URL,
  fontFamily,
  logoSection,
  footerSection,
  accentBar,
} from "./shared-styles";

export interface ReviewRequestEmailProps {
  customerName: string;
  businessName: string;
  reviewUrl: string;
  unsubscribeUrl?: string;
}

export function ReviewRequestEmail({
  customerName = "Alex",
  businessName = "Acme Plumbing",
  reviewUrl = "https://g.page/acme-plumbing/review",
  unsubscribeUrl,
}: ReviewRequestEmailProps) {
  const unsub = unsubscribeUrl || `${APP_URL}/unsubscribe`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`How was your experience with ${businessName}?`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            <Text style={heading}>How did we do?</Text>
            <Text style={paragraph}>
              Hi {customerName}, thank you for choosing{" "}
              <strong>{businessName}</strong>! We hope you had a great
              experience.
            </Text>
            <Text style={paragraph}>
              Would you mind taking 30 seconds to leave us a review? It really
              helps small businesses like ours grow.
            </Text>

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={reviewUrl}>
                Leave a Review
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={mutedSmall}>
              Thank you so much &mdash; it means the world to us!
            </Text>
            <Text style={signOff}>
              &mdash; The {businessName} Team
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({ isTransactional: false, unsubscribeUrl: unsub })}
        </Container>
      </Body>
    </Html>
  );
}

ReviewRequestEmail.PreviewProps = {
  customerName: "Alex",
  businessName: "Acme Plumbing",
  reviewUrl: "https://g.page/acme-plumbing/review",
  unsubscribeUrl: "https://www.trysovereignai.com/unsubscribe",
} satisfies ReviewRequestEmailProps;

export default ReviewRequestEmail;

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
  backgroundColor: BRAND.gold,
  color: BRAND.headerBg,
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

const signOff: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.light,
  margin: "8px 0 0",
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
