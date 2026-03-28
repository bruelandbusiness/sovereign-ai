/**
 * Monthly ROI report email — summarizes monthly performance and return
 * on investment for the business owner.
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

export interface MonthlyRoiReportEmailProps {
  name: string;
  businessName: string;
  month: string;
  leadsGenerated: number;
  callsAnswered: number;
  reviewsManaged: number;
  bookings: number;
  estimatedRevenue: number;
  aiCost: number;
  roi: number;
  monthOverMonthChange?: number;
  highlights: string[];
  dashboardUrl: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}%`;
}

export function MonthlyRoiReportEmail({
  name = "Jane",
  businessName = "Acme Plumbing",
  month = "March 2026",
  leadsGenerated = 94,
  callsAnswered = 187,
  reviewsManaged = 31,
  bookings = 52,
  estimatedRevenue = 36400,
  aiCost = 499,
  roi = 7195,
  monthOverMonthChange = 12,
  highlights = [
    "AI Chatbot handled 89% of inquiries without human intervention",
    "Average lead response time: 8 seconds (industry avg: 42 hours)",
    "Review rating improved from 4.2 to 4.6 stars on Google",
    "3 new 5-star reviews generated from automated follow-ups",
  ],
  dashboardUrl = "https://www.trysovereignai.com/dashboard",
}: MonthlyRoiReportEmailProps) {
  const stats = [
    { label: "Leads", value: String(leadsGenerated), color: BRAND.primary },
    { label: "Calls", value: String(callsAnswered), color: BRAND.accent },
    { label: "Reviews", value: String(reviewsManaged), color: BRAND.gold },
    { label: "Bookings", value: String(bookings), color: BRAND.warning },
  ];

  const isPositive =
    monthOverMonthChange != null ? monthOverMonthChange >= 0 : false;
  const changeColor = isPositive ? BRAND.accent : BRAND.danger;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`${month} ROI Report: ${formatCurrency(estimatedRevenue)} revenue, ${roi}% ROI for ${businessName}.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            <Text style={heading}>Monthly ROI Report</Text>
            <Text style={subheading}>{businessName} &mdash; {month}</Text>

            <Text style={paragraph}>
              Hi {name}, here&rsquo;s your monthly summary showing the
              impact of AI on your business.
            </Text>

            {/* Month-over-month badge */}
            {monthOverMonthChange != null ? (
              <Section style={changeBadgeContainer}>
                <Text
                  style={{
                    ...changeBadge,
                    backgroundColor: `${changeColor}15`,
                    color: changeColor,
                  }}
                >
                  {isPositive ? "\u25B2" : "\u25BC"}{" "}
                  {formatPercent(monthOverMonthChange)} vs last month
                </Text>
              </Section>
            ) : null}

            {/* Key stats grid */}
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

            {/* ROI Card */}
            <Section style={roiCard}>
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td style={roiMetricCell}>
                      <Text style={roiMetricLabel}>Est. Revenue</Text>
                      <Text style={roiMetricValue}>
                        {formatCurrency(estimatedRevenue)}
                      </Text>
                    </td>
                    <td style={roiMetricCell}>
                      <Text style={roiMetricLabel}>AI Investment</Text>
                      <Text style={roiMetricValueMuted}>
                        {formatCurrency(aiCost)}
                      </Text>
                    </td>
                    <td style={roiMetricCell}>
                      <Text style={roiMetricLabel}>ROI</Text>
                      <Text style={roiMetricValueAccent}>{`${roi}%`}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Highlights */}
            {highlights.length > 0 ? (
              <>
                <Text style={highlightsHeading}>Monthly Highlights</Text>
                {highlights.map((highlight, i) => (
                  <Section key={i} style={highlightRow}>
                    <table
                      role="presentation"
                      cellSpacing={0}
                      cellPadding={0}
                      style={{ width: "100%" }}
                    >
                      <tbody>
                        <tr>
                          <td style={highlightDot}>
                            <Text style={dotText}>{"\u2022"}</Text>
                          </td>
                          <td>
                            <Text style={highlightText}>{highlight}</Text>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Section>
                ))}
              </>
            ) : null}

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={dashboardUrl}>
                View Full Report
              </Button>
            </Section>

            <Text style={mutedSmallCenter}>
              This report is generated on the 1st of each month. Your AI
              systems continue to learn and improve every day.
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

MonthlyRoiReportEmail.PreviewProps = {
  name: "Jane",
  businessName: "Acme Plumbing",
  month: "March 2026",
  leadsGenerated: 94,
  callsAnswered: 187,
  reviewsManaged: 31,
  bookings: 52,
  estimatedRevenue: 36400,
  aiCost: 499,
  roi: 7195,
  monthOverMonthChange: 12,
  highlights: [
    "AI Chatbot handled 89% of inquiries without human intervention",
    "Average lead response time: 8 seconds (industry avg: 42 hours)",
    "Review rating improved from 4.2 to 4.6 stars on Google",
    "3 new 5-star reviews generated from automated follow-ups",
  ],
  dashboardUrl: "https://www.trysovereignai.com/dashboard",
} satisfies MonthlyRoiReportEmailProps;

export default MonthlyRoiReportEmail;

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
  color: BRAND.text,
  margin: "0 0 4px",
  lineHeight: "1.3",
  fontFamily,
};

const subheading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: BRAND.muted,
  margin: "0 0 20px",
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
  padding: "12px 4px",
  width: "25%",
};

const statValue: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  margin: "0",
  lineHeight: "1",
  fontFamily,
};

const statLabel: React.CSSProperties = {
  fontSize: "11px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "6px 0 0",
  fontFamily,
};

const roiCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "20px",
  margin: "16px 0 24px",
  borderLeft: `4px solid ${BRAND.accent}`,
};

const roiMetricCell: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "8px 4px",
  width: "33.33%",
};

const roiMetricLabel: React.CSSProperties = {
  fontSize: "11px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
  fontFamily,
};

const roiMetricValue: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: BRAND.text,
  margin: "0",
  fontFamily,
};

const roiMetricValueMuted: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: BRAND.muted,
  margin: "0",
  fontFamily,
};

const roiMetricValueAccent: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: BRAND.accent,
  margin: "0",
  fontFamily,
};

const highlightsHeading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: BRAND.text,
  margin: "0 0 12px",
  lineHeight: "1.3",
  fontFamily,
};

const highlightRow: React.CSSProperties = {
  margin: "0 0 2px",
};

const highlightDot: React.CSSProperties = {
  width: "20px",
  verticalAlign: "top",
  paddingTop: "2px",
};

const dotText: React.CSSProperties = {
  fontSize: "16px",
  color: BRAND.accent,
  margin: "0",
  lineHeight: "1.5",
  fontFamily,
};

const highlightText: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "1.5",
  margin: "0 0 4px",
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
