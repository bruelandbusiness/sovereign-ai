/**
 * Shared brand constants, styles, and reusable layout sections for
 * React Email templates.
 */

import { Img, Section, Text } from "@react-email/components";
import * as React from "react";

// ── Brand Constants ─────────────────────────────────────────────────

export const BRAND = {
  /** Dark background */
  headerBg: "#0a0a1a",
  /** Page / body background */
  pageBg: "#111114",
  /** Primary accent green */
  accent: "#10b981",
  /** Secondary accent blue */
  primary: "#4c85ff",
  /** Danger red */
  danger: "#ef4444",
  /** Warning amber */
  warning: "#f59e0b",
  /** Star gold */
  gold: "#fbbf24",
  /** Body text (light for dark theme) */
  text: "#e4e4e7",
  /** Muted / secondary text */
  muted: "#a1a1aa",
  /** Light muted text */
  light: "#71717a",
  /** Card backgrounds */
  cardBg: "#18181b",
  /** Card background alternative (slightly lighter) */
  cardBgAlt: "#27272a",
  /** Border / separator */
  border: "#3f3f46",
  /** White */
  white: "#ffffff",
} as const;

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

export const COMPANY_ADDRESS =
  process.env.COMPANY_ADDRESS ||
  "123 Main Street, Suite 100, Austin, TX 78701";

export const LOGO_URL = `${APP_URL}/logo.png`;

export const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// ── Reusable Layout Sections ────────────────────────────────────────

/** Thin accent gradient bar at the top of the email. */
export function accentBar(): React.ReactElement {
  return (
    <Section
      style={{
        height: "4px",
        background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
        backgroundColor: BRAND.accent,
      }}
    />
  );
}

/** Logo section with brand name. */
export function logoSection(): React.ReactElement {
  return (
    <Section style={logoSectionStyle}>
      <Img
        src={LOGO_URL}
        alt="Sovereign AI"
        width="40"
        height="40"
        style={logoImgStyle}
      />
      <Text style={logoText}>Sovereign AI</Text>
      <Text style={logoTagline}>AI-Powered Marketing</Text>
    </Section>
  );
}

/** Footer section with company info and optional unsubscribe. */
export function footerSection(opts: {
  isTransactional?: boolean;
  unsubscribeUrl?: string;
}): React.ReactElement {
  const showUnsub = !opts.isTransactional && opts.unsubscribeUrl;
  return (
    <Section style={footerStyle}>
      <Text style={footerBrand}>Sovereign AI</Text>
      <Text style={footerTagline}>
        AI-Powered Marketing for Local Businesses
      </Text>
      <Text style={footerAddress}>{COMPANY_ADDRESS}</Text>
      {showUnsub ? (
        <Text style={footerAddress}>
          <a href={opts.unsubscribeUrl} style={footerLink}>
            Unsubscribe
          </a>
        </Text>
      ) : null}
    </Section>
  );
}

// ── Style Objects ───────────────────────────────────────────────────

const logoSectionStyle: React.CSSProperties = {
  backgroundColor: BRAND.headerBg,
  padding: "28px 32px",
  textAlign: "center" as const,
};

const logoImgStyle: React.CSSProperties = {
  margin: "0 auto 8px",
  display: "block",
};

const logoText: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: BRAND.white,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
  fontFamily,
};

const logoTagline: React.CSSProperties = {
  fontSize: "11px",
  color: BRAND.light,
  letterSpacing: "1.5px",
  textTransform: "uppercase" as const,
  margin: "0",
  fontFamily,
};

const footerStyle: React.CSSProperties = {
  padding: "24px 32px 32px",
  textAlign: "center" as const,
  backgroundColor: BRAND.headerBg,
};

const footerBrand: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0 0 4px",
  fontFamily,
};

const footerTagline: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.light,
  margin: "0 0 8px",
  fontFamily,
};

const footerAddress: React.CSSProperties = {
  fontSize: "11px",
  color: BRAND.light,
  margin: "0 0 4px",
  fontFamily,
};

const footerLink: React.CSSProperties = {
  color: BRAND.light,
  textDecoration: "underline",
  fontSize: "12px",
};
