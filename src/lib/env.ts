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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (isProduction) {
      throw new Error(
        `Missing required environment variable: ${name}. Cannot start in production without it.`
      );
    }
    console.warn(`[env] WARNING: Missing environment variable "${name}" (required in production)`);
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
    if (isProduction) {
      throw new Error(
        `Missing environment variable: ${name}. This variable is required in production.`
      );
    }
    console.warn(`[env] WARNING: Missing environment variable "${name}" (required in production)`);
    return "";
  }
  return value;
}

function optionalVar(name: string, fallback: string = ""): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[env] Optional variable "${name}" not set — using fallback "${fallback}"`);
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
      console.warn(
        `[env] Integration variable "${name}" is not set — related features will be disabled.`
      );
    } else if (process.env.NODE_ENV === "development") {
      console.warn(`[env] Optional variable "${name}" not set — using fallback "${fallback}"`);
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
    if (isProduction) {
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

  // ── Optional with defaults ──────────────────────────────────
  NEXT_PUBLIC_APP_URL: (() => {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (!url) {
      if (isProduction) {
        // In production, fall back to the canonical domain rather than
        // localhost so that emails, cron jobs, and callbacks always contain
        // a valid public URL even if the deployer forgets to set this.
        console.warn(
          '[env] WARNING: NEXT_PUBLIC_APP_URL not set in production — falling back to "https://sovereignai.com". ' +
            "Set this variable to your canonical domain."
        );
        return "https://sovereignai.com";
      }
      return "http://localhost:3000";
    }
    return url;
  })(),
  ANTHROPIC_API_KEY: optionalVar("ANTHROPIC_API_KEY"),
  FROM_EMAIL: optionalVar("FROM_EMAIL", "noreply@sovereignai.com"),

  // ── Client-side Sentry DSN (public, safe to expose) ────────
  NEXT_PUBLIC_SENTRY_DSN: optionalVar("NEXT_PUBLIC_SENTRY_DSN"),

  // ── VAPID subject for Web Push ─────────────────────────────
  VAPID_SUBJECT: optionalVar("VAPID_SUBJECT", "mailto:support@sovereignai.com"),

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

  // ── Convenience ─────────────────────────────────────────────
  NODE_ENV: process.env.NODE_ENV || "development",
  isProduction,
} as const;
