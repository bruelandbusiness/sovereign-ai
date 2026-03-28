/**
 * Booking confirmation email sent to a customer after they book an
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
  fontFamily,
  logoSection,
  footerSection,
  accentBar,
} from "./shared-styles";

export interface BookingConfirmationEmailProps {
  customerName: string;
  businessName: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  /** Optional link for the customer to manage / cancel the booking. */
  manageUrl?: string;
}

export function BookingConfirmationEmail({
  customerName = "Alex",
  businessName = "Acme Plumbing",
  serviceType = "General Consultation",
  appointmentDate = "January 15, 2026",
  appointmentTime = "2:00 PM",
  manageUrl,
}: BookingConfirmationEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`Your appointment with ${businessName} is confirmed for ${appointmentDate} at ${appointmentTime}.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            <Text style={heading}>Booking Confirmed</Text>
            <Text style={paragraph}>
              Hi {customerName}, your appointment with{" "}
              <strong>{businessName}</strong> has been confirmed.
            </Text>

            <Section style={detailCard}>
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td style={detailLabel}>Service</td>
                    <td style={detailValue}>{serviceType}</td>
                  </tr>
                  <tr>
                    <td style={detailLabel}>Date</td>
                    <td style={detailValue}>{appointmentDate}</td>
                  </tr>
                  <tr>
                    <td style={detailLabel}>Time</td>
                    <td style={detailValue}>{appointmentTime}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {manageUrl ? (
              <Section style={buttonContainer}>
                <Button style={ctaButton} href={manageUrl}>
                  Manage Booking
                </Button>
              </Section>
            ) : null}

            <Hr style={divider} />

            <Text style={mutedSmall}>
              Need to reschedule? Reply to this email and we&rsquo;ll help you
              find a new time.
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({ isTransactional: true })}
        </Container>
      </Body>
    </Html>
  );
}

BookingConfirmationEmail.PreviewProps = {
  customerName: "Alex",
  businessName: "Acme Plumbing",
  serviceType: "General Consultation",
  appointmentDate: "January 15, 2026",
  appointmentTime: "2:00 PM",
  manageUrl: "https://www.trysovereignai.com/bookings/abc123",
} satisfies BookingConfirmationEmailProps;

export default BookingConfirmationEmail;

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

const detailCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px 0",
};

const detailLabel: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  paddingBottom: "10px",
  paddingRight: "16px",
  verticalAlign: "top",
  fontFamily,
};

const detailValue: React.CSSProperties = {
  fontSize: "15px",
  color: BRAND.text,
  paddingBottom: "10px",
  verticalAlign: "top",
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
