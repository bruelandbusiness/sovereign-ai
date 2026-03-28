/**
 * Review alert email — notifies business owner when a new review is received.
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

export interface ReviewAlertEmailProps {
  name: string;
  businessName: string;
  reviewerName: string;
  rating: number;
  reviewContent: string;
  reviewSource: string;
  reviewDate: string;
  respondUrl: string;
}

function renderStars(rating: number): string {
  const filled = Math.min(Math.max(Math.round(rating), 0), 5);
  const empty = 5 - filled;
  return "\u2605".repeat(filled) + "\u2606".repeat(empty);
}

export function ReviewAlertEmail({
  name = "Jane",
  businessName = "Acme Plumbing",
  reviewerName = "Sarah Johnson",
  rating = 5,
  reviewContent = "Fantastic service! The team arrived on time, explained everything clearly, and left the place spotless. Highly recommend Acme Plumbing to anyone in the area.",
  reviewSource = "Google",
  reviewDate = "March 28, 2026",
  respondUrl = "https://www.trysovereignai.com/dashboard/reviews",
}: ReviewAlertEmailProps) {
  const starColor = rating >= 4 ? BRAND.gold : rating >= 3 ? BRAND.warning : BRAND.danger;
  const sentimentLabel = rating >= 4 ? "Positive" : rating >= 3 ? "Neutral" : "Needs Attention";
  const sentimentColor = rating >= 4 ? BRAND.accent : rating >= 3 ? BRAND.warning : BRAND.danger;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`New ${rating}-star review from ${reviewerName} on ${reviewSource} for ${businessName}.`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {accentBar()}
          {logoSection()}

          <Section style={content}>
            {/* Alert banner */}
            <Section style={alertBanner}>
              <Text style={alertBannerText}>
                {`New ${rating}-Star Review on ${reviewSource}`}
              </Text>
            </Section>

            <Text style={paragraph}>
              Hi {name}, <strong>{businessName}</strong> just received a new
              review on {reviewSource}.
            </Text>

            {/* Review card */}
            <Section style={reviewCard}>
              {/* Stars */}
              <Text style={{ ...starsText, color: starColor }}>
                {renderStars(rating)}
              </Text>

              {/* Reviewer name and date */}
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ width: "100%", marginBottom: "16px" }}
              >
                <tbody>
                  <tr>
                    <td>
                      <Text style={reviewerNameStyle}>{reviewerName}</Text>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Text style={reviewDateStyle}>{reviewDate}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Review content */}
              <Text style={reviewContentStyle}>
                &ldquo;{reviewContent}&rdquo;
              </Text>

              {/* Source & Sentiment badges */}
              <table
                role="presentation"
                cellSpacing={0}
                cellPadding={0}
                style={{ marginTop: "16px" }}
              >
                <tbody>
                  <tr>
                    <td style={{ paddingRight: "8px" }}>
                      <Text style={sourceBadge}>{reviewSource}</Text>
                    </td>
                    <td>
                      <Text
                        style={{
                          ...sentimentBadge,
                          backgroundColor: `${sentimentColor}15`,
                          color: sentimentColor,
                        }}
                      >
                        {sentimentLabel}
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section style={buttonContainer}>
              <Button style={ctaButton} href={respondUrl}>
                Respond to Review
              </Button>
            </Section>

            <Text style={mutedSmallCenter}>
              {rating >= 4
                ? "Great reviews build trust with new customers. Consider thanking this reviewer!"
                : "Responding promptly to feedback shows customers you care. Address this review soon."}
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

ReviewAlertEmail.PreviewProps = {
  name: "Jane",
  businessName: "Acme Plumbing",
  reviewerName: "Sarah Johnson",
  rating: 5,
  reviewContent:
    "Fantastic service! The team arrived on time, explained everything clearly, and left the place spotless. Highly recommend Acme Plumbing to anyone in the area.",
  reviewSource: "Google",
  reviewDate: "March 28, 2026",
  respondUrl: "https://www.trysovereignai.com/dashboard/reviews",
} satisfies ReviewAlertEmailProps;

export default ReviewAlertEmail;

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

const alertBanner: React.CSSProperties = {
  backgroundColor: "#fbbf2415",
  border: `1px solid ${BRAND.gold}33`,
  borderRadius: "8px",
  padding: "14px 20px",
  textAlign: "center" as const,
  marginBottom: "24px",
};

const alertBannerText: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: BRAND.gold,
  margin: "0",
  fontFamily,
};

const reviewCard: React.CSSProperties = {
  backgroundColor: BRAND.cardBgAlt,
  borderRadius: "12px",
  padding: "24px",
  margin: "20px 0",
};

const starsText: React.CSSProperties = {
  fontSize: "28px",
  margin: "0 0 12px",
  lineHeight: "1",
  fontFamily,
};

const reviewerNameStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: BRAND.text,
  margin: "0",
  fontFamily,
};

const reviewDateStyle: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  margin: "0",
  fontFamily,
};

const reviewContentStyle: React.CSSProperties = {
  fontSize: "15px",
  color: BRAND.text,
  lineHeight: "1.6",
  margin: "0",
  fontStyle: "italic",
  fontFamily,
};

const sourceBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "16px",
  fontSize: "12px",
  fontWeight: 600,
  backgroundColor: `${BRAND.primary}20`,
  color: BRAND.primary,
  margin: "0",
  fontFamily,
};

const sentimentBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 12px",
  borderRadius: "16px",
  fontSize: "12px",
  fontWeight: 600,
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
