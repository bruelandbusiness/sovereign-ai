import { logger } from "@/lib/logger";
/**
 * Environment variable validation.
 *
 * - In production, throws if critical vars are missing.
 * - In dev, warns about missing optional vars.
 *
 * Variables are grouped into three tiers:
 *   1. **Required always** — app will not start without them.
 *   2. **Required in production** — warns in dev, throws in prod.
 *   3. **Optional (integration)** — warns once in prod, never crashes.
 */

const isProduction = process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (isProduction && !isBuildPhase) {
      throw new Error(
        `Missing required environment variable: ${name}. Cannot start in production without it.`
      );
    }
    logger.warn(`[env] WARNING: Missing environment variable "${name}" (required in production)`);
    return "";
  }
  return value;
}

/**
 * Variables that must exist in production but are safe to skip in dev.
 * In production the app will throw at startup; in dev it only warns.
 */
function requireInProd(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (isProduction && !isBuildPhase) {
      throw new Error(
        `Missing environment variable: ${name}. This variable is required in production.`
      );
    }
    logger.warn(`[env] WARNING: Missing environment variable "${name}" (required in production)`);
    return "";
  }
  return value;
}

function optionalVar(name: string, fallback: string = ""): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "development") {
      logger.warn(`[env] Optional variable "${name}" not set — using fallback "${fallback}"`);
    }
    return fallback;
  }
  return value;
}

// Track which optional vars have already been warned about so we only warn once
const _warnedOptional = new Set<string>();

/**
 * Optional integration variable. In production, logs a single warning if
 * missing so operators know the feature will be degraded — but never crashes.
 */
function integrationVar(name: string, fallback: string = ""): string {
  const value = process.env[name];
  if (!value) {
    if (isProduction && !_warnedOptional.has(name)) {
      _warnedOptional.add(name);
      logger.warn(
        `[env] Integration variable "${name}" is not set — related features will be disabled.`
      );
    } else if (process.env.NODE_ENV === "development") {
      logger.warn(`[env] Optional variable "${name}" not set — using fallback "${fallback}"`);
    }
    return fallback;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Validated environment variables
// ---------------------------------------------------------------------------

/** Validated environment variables */
export const env = {
  // ── Required always ─────────────────────────────────────────
  DATABASE_URL: (() => {
    const url = requireVar("DATABASE_URL");
    if (url && !url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
      throw new Error(
        `DATABASE_URL must be a PostgreSQL connection string (starting with "postgres://" or "postgresql://"). Got: "${url.slice(0, 20)}..."`
      );
    }
    return url;
  })(),
  AUTH_SECRET: (() => {
    const secret = requireVar("AUTH_SECRET");
    if (isProduction && !isBuildPhase) {
      if (secret.length < 32 || secret.includes("change-in-production")) {
        throw new Error(
          "AUTH_SECRET must be at least 32 characters and not contain placeholder text in production"
        );
      }
    }
    return secret;
  })(),

  // ── Required in production ──────────────────────────────────
  STRIPE_SECRET_KEY: requireInProd("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: requireInProd("STRIPE_WEBHOOK_SECRET"),
  CRON_SECRET: requireInProd("CRON_SECRET"),
  SENDGRID_API_KEY: requireInProd("SENDGRID_API_KEY"),

  // ── Required in production (localhost fallbacks are dev-only) ─
  NEXT_PUBLIC_APP_URL: (() => {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (!url) {
      if (isProduction && !isBuildPhase) {
        throw new Error(
          "Missing environment variable: NEXT_PUBLIC_APP_URL. This variable is required in production. " +
            "Set it to your canonical domain (e.g. https://trysovereignai.com)."
        );
      }
      // Dev-only fallback
      return "http://localhost:3000";
    }
    return url;
  })(),
  API_URL: (() => {
    const url = process.env.API_URL;
    if (!url) {
      if (isProduction && !isBuildPhase) {
        throw new Error(
          "Missing environment variable: API_URL. This variable is required in production. " +
            "Set it to your API server URL (e.g. https://api.trysovereignai.com)."
        );
      }
      // Dev-only fallback
      return "http://localhost:8000";
    }
    return url;
  })(),
  COMPANY_ADDRESS: optionalVar("COMPANY_ADDRESS", "123 Main Street, Suite 100, Austin, TX 78701"),
  ANTHROPIC_API_KEY: optionalVar("ANTHROPIC_API_KEY"),
  FROM_EMAIL: optionalVar("FROM_EMAIL", "noreply@trysovereignai.com"),

  // ── Client-side Sentry DSN (public, safe to expose) ────────
  NEXT_PUBLIC_SENTRY_DSN: optionalVar("NEXT_PUBLIC_SENTRY_DSN"),

  // ── VAPID subject for Web Push ─────────────────────────────
  VAPID_SUBJECT: optionalVar("VAPID_SUBJECT", "mailto:support@trysovereignai.com"),

  // ── Integration keys (gracefully degrade) ───────────────────
  TWILIO_ACCOUNT_SID: integrationVar("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: integrationVar("TWILIO_AUTH_TOKEN"),
  TWILIO_PHONE_NUMBER: integrationVar("TWILIO_PHONE_NUMBER"),
  GOOGLE_ADS_API_KEY: integrationVar("GOOGLE_ADS_API_KEY"),
  GOOGLE_ADS_CUSTOMER_ID: integrationVar("GOOGLE_ADS_CUSTOMER_ID"),
  GOOGLE_ADS_DEVELOPER_TOKEN: integrationVar("GOOGLE_ADS_DEVELOPER_TOKEN"),
  META_ACCESS_TOKEN: integrationVar("META_ACCESS_TOKEN"),
  FACEBOOK_PAGE_TOKEN: integrationVar("FACEBOOK_PAGE_TOKEN"),
  INSTAGRAM_ACCESS_TOKEN: integrationVar("INSTAGRAM_ACCESS_TOKEN"),
  LINKEDIN_ACCESS_TOKEN: integrationVar("LINKEDIN_ACCESS_TOKEN"),
  TWITTER_API_KEY: integrationVar("TWITTER_API_KEY"),
  TWITTER_API_SECRET: integrationVar("TWITTER_API_SECRET"),
  FACEBOOK_PAGE_ID: integrationVar("FACEBOOK_PAGE_ID"),
  INSTAGRAM_BUSINESS_ID: integrationVar("INSTAGRAM_BUSINESS_ID"),
  LINKEDIN_ORG_ID: integrationVar("LINKEDIN_ORG_ID"),
  GOOGLE_BUSINESS_LOCATION_ID: integrationVar("GOOGLE_BUSINESS_LOCATION_ID"),
  GOOGLE_PLACES_API_KEY: integrationVar("GOOGLE_PLACES_API_KEY"),
  YELP_API_KEY: integrationVar("YELP_API_KEY"),
  WISETACK_API_KEY: integrationVar("WISETACK_API_KEY"),
  META_AD_ACCOUNT_ID: integrationVar("META_AD_ACCOUNT_ID"),
  SENTRY_DSN: integrationVar("SENTRY_DSN"),
  SENDGRID_WEBHOOK_KEY: integrationVar("SENDGRID_WEBHOOK_KEY"),
  STRIPE_INVOICE_WEBHOOK_SECRET: integrationVar("STRIPE_INVOICE_WEBHOOK_SECRET"),
  STRIPE_PRODUCT_WEBHOOK_SECRET: integrationVar("STRIPE_PRODUCT_WEBHOOK_SECRET"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: integrationVar("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
  VAPID_PRIVATE_KEY: integrationVar("VAPID_PRIVATE_KEY"),
  UPSTASH_REDIS_REST_URL: integrationVar("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: integrationVar("UPSTASH_REDIS_REST_TOKEN"),
  FSM_WEBHOOK_SECRET: integrationVar("FSM_WEBHOOK_SECRET"),
  GOOGLE_BUSINESS_TOKEN: integrationVar("GOOGLE_BUSINESS_TOKEN"),
  GOOGLE_CALENDAR_KEY: integrationVar("GOOGLE_CALENDAR_KEY"),
  DATAFORSEO_LOGIN: integrationVar("DATAFORSEO_LOGIN"),
  DATAFORSEO_PASSWORD: integrationVar("DATAFORSEO_PASSWORD"),
  GOOGLE_SEARCH_CONSOLE_KEY: integrationVar("GOOGLE_SEARCH_CONSOLE_KEY"),
  TELEGRAM_BOT_TOKEN: integrationVar("TELEGRAM_BOT_TOKEN"),

  // ── Enrichment pipeline keys ──────────────────────────────────
  ENRICHMENT_REVERSE_ADDRESS_KEY: integrationVar("ENRICHMENT_REVERSE_ADDRESS_KEY"),
  ENRICHMENT_EMAIL_FINDER_KEY: integrationVar("ENRICHMENT_EMAIL_FINDER_KEY"),
  ENRICHMENT_SOCIAL_MATCH_KEY: integrationVar("ENRICHMENT_SOCIAL_MATCH_KEY"),
  WEATHER_API_KEY: integrationVar("WEATHER_API_KEY"),
  PROPERTY_DATA_API_KEY: integrationVar("PROPERTY_DATA_API_KEY"),

  // ── FSM integrations (ServiceTitan, Jobber, Housecall Pro) ──
  SERVICETITAN_ACCESS_TOKEN: integrationVar("SERVICETITAN_ACCESS_TOKEN"),
  SERVICETITAN_CLIENT_ID: integrationVar("SERVICETITAN_CLIENT_ID"),
  SERVICETITAN_CLIENT_SECRET: integrationVar("SERVICETITAN_CLIENT_SECRET"),
  SERVICETITAN_TENANT_ID: integrationVar("SERVICETITAN_TENANT_ID"),
  SERVICETITAN_REFRESH_TOKEN: integrationVar("SERVICETITAN_REFRESH_TOKEN"),
  JOBBER_ACCESS_TOKEN: integrationVar("JOBBER_ACCESS_TOKEN"),
  JOBBER_CLIENT_ID: integrationVar("JOBBER_CLIENT_ID"),
  JOBBER_CLIENT_SECRET: integrationVar("JOBBER_CLIENT_SECRET"),
  JOBBER_REFRESH_TOKEN: integrationVar("JOBBER_REFRESH_TOKEN"),
  HOUSECALLPRO_ACCESS_TOKEN: integrationVar("HOUSECALLPRO_ACCESS_TOKEN"),
  HOUSECALLPRO_CLIENT_ID: integrationVar("HOUSECALLPRO_CLIENT_ID"),
  HOUSECALLPRO_CLIENT_SECRET: integrationVar("HOUSECALLPRO_CLIENT_SECRET"),
  HOUSECALLPRO_REFRESH_TOKEN: integrationVar("HOUSECALLPRO_REFRESH_TOKEN"),

  // ── Encryption ─────────────────────────────────────────────
  ENCRYPTION_KEY: (() => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      if (isProduction && !isBuildPhase) {
        throw new Error(
          "Missing ENCRYPTION_KEY. Generate with: openssl rand -hex 32"
        );
      }
      return "";
    }
    // Validate key is 256-bit (64 hex chars or 44 base64 chars)
    if (isProduction && !isBuildPhase) {
      const isHex64 = /^[0-9a-fA-F]{64}$/.test(key);
      const isBase64_32 =
        /^[A-Za-z0-9+/]{43}=?$/.test(key) ||
        /^[A-Za-z0-9+/]{42}==?$/.test(key);
      if (!isHex64 && !isBase64_32) {
        throw new Error(
          "ENCRYPTION_KEY must be exactly 256 bits (64 hex chars or 44 base64 chars). " +
            "Generate with: openssl rand -hex 32"
        );
      }
    }
    return key;
  })(),

  // ── Google OAuth ──────────────────────────────────────────
  GOOGLE_CLIENT_ID: integrationVar("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: integrationVar("GOOGLE_CLIENT_SECRET"),

  // ── Voice & AI ────────────────────────────────────────────
  ELEVENLABS_API_KEY: integrationVar("ELEVENLABS_API_KEY"),
  ELEVENLABS_VOICE_ID: integrationVar("ELEVENLABS_VOICE_ID"),
  VAPI_API_KEY: integrationVar("VAPI_API_KEY"),

  // ── SEO & Prospect Discovery ──────────────────────────────
  SERPAPI_KEY: integrationVar("SERPAPI_KEY"),
  INBOUND_LEADS_API_KEY: integrationVar("INBOUND_LEADS_API_KEY"),

  // ── Google Maps ───────────────────────────────────────────
  GOOGLE_MAPS_API_KEY: integrationVar("GOOGLE_MAPS_API_KEY"),

  // ── Enrichment URLs ───────────────────────────────────────
  ENRICHMENT_EMAIL_FINDER_URL: integrationVar("ENRICHMENT_EMAIL_FINDER_URL"),
  ENRICHMENT_REVERSE_ADDRESS_URL: integrationVar("ENRICHMENT_REVERSE_ADDRESS_URL"),
  ENRICHMENT_SOCIAL_MATCH_URL: integrationVar("ENRICHMENT_SOCIAL_MATCH_URL"),
  EMAIL_VERIFICATION_THRESHOLD: integrationVar("EMAIL_VERIFICATION_THRESHOLD", "80"),

  // ── Telegram webhook ──────────────────────────────────────
  TELEGRAM_WEBHOOK_SECRET: integrationVar("TELEGRAM_WEBHOOK_SECRET"),

  // ── Email ─────────────────────────────────────────────────
  REPLY_TO_EMAIL: optionalVar("REPLY_TO_EMAIL", "hello@trysovereignai.com"),
  SUPPORT_EMAIL: optionalVar("SUPPORT_EMAIL", "support@trysovereignai.com"),

  // ── Client-side (NEXT_PUBLIC_) ────────────────────────────
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: integrationVar("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  NEXT_PUBLIC_CALENDLY_URL: integrationVar("NEXT_PUBLIC_CALENDLY_URL"),
  NEXT_PUBLIC_GA_ID: integrationVar("NEXT_PUBLIC_GA_ID"),
  NEXT_PUBLIC_FB_PIXEL_ID: integrationVar("NEXT_PUBLIC_FB_PIXEL_ID"),
  NEXT_PUBLIC_GOOGLE_ADS_ID: integrationVar("NEXT_PUBLIC_GOOGLE_ADS_ID"),
  NEXT_PUBLIC_DEMO_VIDEO_ID: integrationVar("NEXT_PUBLIC_DEMO_VIDEO_ID"),
  NEXT_PUBLIC_API_URL: optionalVar("NEXT_PUBLIC_API_URL"),

  // ── PostHog Analytics ──────────────────────────────────────
  NEXT_PUBLIC_POSTHOG_KEY: integrationVar("NEXT_PUBLIC_POSTHOG_KEY"),
  NEXT_PUBLIC_POSTHOG_HOST: integrationVar("NEXT_PUBLIC_POSTHOG_HOST"),

  // ── Contact ────────────────────────────────────────────────
  CONTACT_FORM_RECIPIENT: optionalVar("CONTACT_FORM_RECIPIENT", "hello@trysovereignai.com"),

  // ── Claude model overrides (defaults in each module) ───────
  CLAUDE_ACQUISITION_MODEL: optionalVar("CLAUDE_ACQUISITION_MODEL"),
  CLAUDE_AEO_MODEL: optionalVar("CLAUDE_AEO_MODEL"),
  CLAUDE_AGENT_MODEL: optionalVar("CLAUDE_AGENT_MODEL"),
  CLAUDE_CLASSIFIER_MODEL: optionalVar("CLAUDE_CLASSIFIER_MODEL"),
  CLAUDE_DISCOVERY_MODEL: optionalVar("CLAUDE_DISCOVERY_MODEL"),
  CLAUDE_OUTREACH_MODEL: optionalVar("CLAUDE_OUTREACH_MODEL"),
  CLAUDE_PROPOSAL_MODEL: optionalVar("CLAUDE_PROPOSAL_MODEL"),
  CLAUDE_REPORT_MODEL: optionalVar("CLAUDE_REPORT_MODEL"),
  CLAUDE_REPUTATION_MODEL: optionalVar("CLAUDE_REPUTATION_MODEL"),
  CLAUDE_REVIEW_MODEL: optionalVar("CLAUDE_REVIEW_MODEL"),
  CLAUDE_VOICE_MODEL: optionalVar("CLAUDE_VOICE_MODEL"),

  // ── Convenience ─────────────────────────────────────────────
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction,
} as const;
