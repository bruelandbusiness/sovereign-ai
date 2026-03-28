/**
 * Booking reminder email sent to a customer before their upcoming
 * appointment. Uses the shared dark-theme brand layout.
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
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

export interface BookingReminderEmailProps {
  customerName: string;
  businessName: string;
  appointmentDate: string;
  appointmentTime: string;
}

export function BookingReminderEmail({
  customerName = "Alex",
  businessName = "Acme Plumbing",
  appointmentDate = "January 15, 2026",
  appointmentTime = "2:00 PM",
}: BookingReminderEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`Reminder: Your appointment with ${businessName} on ${appointmentDate}`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            <Text style={heading}>Appointment Reminder</Text>
            <Text style={paragraph}>
              Hi {customerName}, this is a friendly reminder that you have an
              upcoming appointment with <strong>{businessName}</strong>.
            </Text>

            <Section style={detailCard}>
              <Text style={dateText}>{appointmentDate}</Text>
              <Text style={timeText}>at {appointmentTime}</Text>
            </Section>

            <Hr style={divider} />

            <Text style={mutedSmall}>
              If you need to reschedule, please contact us as soon as possible.
            </Text>
            <Text style={signOff}>
              &mdash; The {businessName} Team
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({ isTransactional: true })}
        </Container>
      </Body>
    </Html>
  );
}

BookingReminderEmail.PreviewProps = {
  customerName: "Alex",
  businessName: "Acme Plumbing",
  appointmentDate: "January 15, 2026",
  appointmentTime: "2:00 PM",
} satisfies BookingReminderEmailProps;

export default BookingReminderEmail;

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
  textAlign: "center" as const,
};

const dateText: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0",
  fontFamily,
};

const timeText: React.CSSProperties = {
  fontSize: "16px",
  color: BRAND.muted,
  margin: "8px 0 0",
  fontFamily,
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
