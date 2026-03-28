/**
 * Weekly performance report email template using React Email.
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

export interface WeeklyReportEmailProps {
  name: string;
  businessName: string;
  weekOf: string;
  leads: number;
  callsAnswered: number;
  reviewsGenerated: number;
  bookings: number;
  estimatedRevenue: number;
  weekOverWeekChange?: number;
  topActions: string[];
  dashboardUrl: string;
  narrative?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function WeeklyReportEmail({
  name = "Jane",
  businessName = "Acme Plumbing",
  weekOf = "March 22 - March 28, 2026",
  leads = 23,
  callsAnswered = 47,
  reviewsGenerated = 8,
  bookings = 12,
  estimatedRevenue = 8400,
  weekOverWeekChange = 15,
  topActions = [
    "Follow up with 3 hot leads from Thursday",
    "Respond to 2 pending Google reviews",
    "Consider upgrading to Growth plan for more chatbot capacity",
  ],
  dashboardUrl = "https://www.trysovereignai.com/dashboard",
  narrative = "Strong week overall. Lead volume is up 15% driven by your new Google Ads campaign. Chatbot handled 92% of after-hours inquiries autonomously.",
}: WeeklyReportEmailProps) {
  const stats = [
    { label: "New Leads", value: String(leads), color: BRAND.primary },
    {
      label: "Calls Answered",
      value: String(callsAnswered),
      color: BRAND.accent,
    },
    { label: "Reviews", value: String(reviewsGenerated), color: BRAND.warning },
  ];

  const isPositive =
    weekOverWeekChange != null ? weekOverWeekChange >= 0 : false;
  const changeColor = isPositive ? BRAND.accent : BRAND.danger;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`${leads} leads, ${callsAnswered} calls answered, ${reviewsGenerated} reviews this week for ${businessName}.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            <Text style={heading}>
              Weekly Report for {businessName}
            </Text>
            <Text style={paragraph}>
              Hi {name}, here&rsquo;s your AI marketing performance for the
              week of <strong>{weekOf}</strong>.
            </Text>

            {/* Week-over-week change badge */}
            {weekOverWeekChange != null ? (
              <Section style={changeBadgeContainer}>
                <Text
                  style={{
                    ...changeBadge,
                    backgroundColor: `${changeColor}15`,
                    color: changeColor,
                  }}
                >
                  {isPositive ? "\u25B2" : "\u25BC"}{" "}
                  {isPositive ? "+" : ""}
                  {weekOverWeekChange}% vs last week
                </Text>
              </Section>
            ) : null}

            {/* Key stats */}
            <Section style={statsCard}>
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%" }}
              >
                <tbody>
                  <tr>
                    {stats.map((stat) => (
                      <td key={stat.label} style={statCell}>
                        <Text style={{ ...statValue, color: stat.color }}>
                          {stat.value}
                        </Text>
                        <Text style={statLabel}>{stat.label}</Text>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Detailed metrics */}
            <Section style={detailsCard}>
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td style={metricLabel}>Bookings</td>
                    <td style={metricValue}>{bookings}</td>
                  </tr>
                  <tr>
                    <td style={metricLabelLast}>Est. Revenue Impact</td>
                    <td style={metricValueRevenue}>
                      {formatCurrency(estimatedRevenue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* AI narrative */}
            {narrative ? (
              <Section style={narrativeCard}>
                <Text style={narrativeText}>{narrative}</Text>
              </Section>
            ) : null}

            {/* Recommended actions */}
            {topActions.length > 0 ? (
              <>
                <Text style={actionsHeading}>Recommended Actions</Text>
                <table
                  role="presentation"
                  cellSpacing={0}
                  cellPadding={0}
                  style={{ width: "100%" }}
                >
                  <tbody>
                    {topActions.map((action, i) => (
                      <tr key={i}>
                        <td style={actionNumCell}>
                          <Text style={actionNum}>{i + 1}</Text>
                        </td>
                        <td style={actionTextCell}>
                          <Text style={actionText}>{action}</Text>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={dashboardUrl}>
                View Full Dashboard
              </Button>
            </Section>

            <Text style={mutedSmallCenter}>
              Your AI systems are working 24/7. This report is generated every
              Monday morning.
            </Text>
          </Section>

          <Hr style={footerDivider} />
          {footerSection({
            unsubscribeUrl: `${APP_URL}/dashboard/settings/account`,
          })}
        </Container>
      </Body>
    </Html>
  );
}

WeeklyReportEmail.PreviewProps = {
  name: "Jane",
  businessName: "Acme Plumbing",
  weekOf: "March 22 - March 28, 2026",
  leads: 23,
  callsAnswered: 47,
  reviewsGenerated: 8,
  bookings: 12,
  estimatedRevenue: 8400,
  weekOverWeekChange: 15,
  topActions: [
    "Follow up with 3 hot leads from Thursday",
    "Respond to 2 pending Google reviews",
    "Consider upgrading to Growth plan for more chatbot capacity",
  ],
  dashboardUrl: "https://www.trysovereignai.com/dashboard",
  narrative:
    "Strong week overall. Lead volume is up 15% driven by your new Google Ads campaign. Chatbot handled 92% of after-hours inquiries autonomously.",
} satisfies WeeklyReportEmailProps;

export default WeeklyReportEmail;

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
  color: BRAND.text,
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

const changeBadgeContainer: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const changeBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 16px",
  borderRadius: "20px",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0",
  fontFamily,
};

const statsCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "20px 8px",
  margin: "24px 0",
};

const statCell: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "12px 8px",
  width: "33.33%",
};

const statValue: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  margin: "0",
  lineHeight: "1",
  fontFamily,
};

const statLabel: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "6px 0 0",
  fontFamily,
};

const detailsCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "20px",
  margin: "16px 0",
};

const metricLabel: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: `1px solid ${BRAND.border}`,
  fontSize: "14px",
  color: BRAND.muted,
  fontFamily,
};

const metricValue: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: `1px solid ${BRAND.border}`,
  fontSize: "16px",
  fontWeight: 600,
  color: BRAND.text,
  textAlign: "right" as const,
  fontFamily,
};

const metricLabelLast: React.CSSProperties = {
  padding: "10px 0",
  fontSize: "14px",
  color: BRAND.muted,
  fontFamily,
};

const metricValueRevenue: React.CSSProperties = {
  padding: "10px 0",
  fontSize: "16px",
  fontWeight: 600,
  color: BRAND.accent,
  textAlign: "right" as const,
  fontFamily,
};

const narrativeCard: React.CSSProperties = {
  borderLeft: `4px solid ${BRAND.primary}`,
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "0 8px 8px 0",
  padding: "16px 20px",
  margin: "24px 0",
};

const narrativeText: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "1.6",
  margin: "0",
  fontFamily,
};

const actionsHeading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: BRAND.text,
  margin: "24px 0 12px",
  lineHeight: "1.3",
  fontFamily,
};

const actionNumCell: React.CSSProperties = {
  width: "32px",
  verticalAlign: "top",
  paddingTop: "8px",
};

const actionNum: React.CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: BRAND.primary,
  color: BRAND.white,
  textAlign: "center" as const,
  lineHeight: "20px",
  fontSize: "11px",
  fontWeight: 700,
  margin: "0",
  fontFamily,
};

const actionTextCell: React.CSSProperties = {
  verticalAlign: "top",
  padding: "8px 0 8px 10px",
};

const actionText: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "1.5",
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
