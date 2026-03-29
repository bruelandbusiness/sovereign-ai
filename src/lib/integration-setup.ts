/**
 * Integration Setup Wizard Utility
 *
 * Pure logic for guiding users through the setup of each major
 * platform integration. No actual API calls — all inputs are passed
 * as function arguments and all outputs are returned as immutable
 * data structures.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Supported integration identifiers. */
export type IntegrationId =
  | "google-ads"
  | "google-business-profile"
  | "meta"
  | "stripe"
  | "sendgrid"
  | "twilio"
  | "openai"
  | "anthropic";

/** Input field type for a wizard step. */
export type StepFieldType =
  | "text"
  | "password"
  | "number"
  | "select"
  | "boolean"
  | "email"
  | "url"
  | "phone";

/** A single input field within a wizard step. */
export interface StepField {
  readonly name: string;
  readonly label: string;
  readonly type: StepFieldType;
  readonly required: boolean;
  readonly placeholder?: string;
  readonly options?: readonly string[];
  readonly helpText?: string;
}

/** A single step in the integration setup wizard. */
export interface IntegrationStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly fields: readonly StepField[];
  /** Estimated minutes to complete this step. */
  readonly estimatedMinutes: number;
  /** Whether this step requires external action (e.g. domain DNS). */
  readonly requiresExternalAction: boolean;
}

/** The full wizard definition for a single integration. */
export interface SetupWizard {
  readonly integrationId: IntegrationId;
  readonly name: string;
  readonly description: string;
  readonly steps: readonly IntegrationStep[];
  readonly requiredEnvVars: readonly string[];
  /** Total estimated minutes across all steps. */
  readonly totalEstimatedMinutes: number;
}

/** Configuration data collected from a completed wizard. */
export interface IntegrationConfig {
  readonly integrationId: IntegrationId;
  readonly completedAt: string;
  readonly stepData: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly envVarsSet: readonly string[];
}

/** Result of validating data for a single step. */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
}

/** A single validation error for a field. */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

/** Test payload used to verify an integration connection. */
export interface TestPayload {
  readonly integrationId: IntegrationId;
  readonly endpoint: string;
  readonly method: "GET" | "POST" | "PUT";
  readonly headers: Readonly<Record<string, string>>;
  readonly body: Readonly<Record<string, unknown>> | null;
  readonly expectedStatus: number;
}

/* ------------------------------------------------------------------ */
/*  Constants — Wizard Definitions                                     */
/* ------------------------------------------------------------------ */

const GOOGLE_ADS_WIZARD: SetupWizard = {
  integrationId: "google-ads",
  name: "Google Ads",
  description: "Connect your Google Ads account to manage campaigns, budgets, and audience targeting.",
  requiredEnvVars: [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
  ],
  totalEstimatedMinutes: 15,
  steps: [
    {
      id: "google-ads-connect",
      title: "Connect Account",
      description: "Authorize Sovereign AI to access your Google Ads account via OAuth.",
      order: 1,
      estimatedMinutes: 3,
      requiresExternalAction: true,
      fields: [
        {
          name: "clientId",
          label: "Client ID",
          type: "text",
          required: true,
          placeholder: "123456789.apps.googleusercontent.com",
          helpText: "Found in the Google Cloud Console under APIs & Services > Credentials.",
        },
        {
          name: "clientSecret",
          label: "Client Secret",
          type: "password",
          required: true,
          placeholder: "GOCSPX-...",
        },
        {
          name: "customerId",
          label: "Customer ID",
          type: "text",
          required: true,
          placeholder: "123-456-7890",
          helpText: "Your 10-digit Google Ads customer ID (with or without dashes).",
        },
      ],
    },
    {
      id: "google-ads-budget",
      title: "Set Budget",
      description: "Configure default daily and monthly budget limits for your campaigns.",
      order: 2,
      estimatedMinutes: 3,
      requiresExternalAction: false,
      fields: [
        {
          name: "dailyBudget",
          label: "Default Daily Budget (USD)",
          type: "number",
          required: true,
          placeholder: "50",
        },
        {
          name: "monthlyBudgetCap",
          label: "Monthly Budget Cap (USD)",
          type: "number",
          required: true,
          placeholder: "1500",
        },
        {
          name: "autoPauseOnCap",
          label: "Auto-pause when cap is reached",
          type: "boolean",
          required: false,
          helpText: "Automatically pauses all campaigns when the monthly cap is hit.",
        },
      ],
    },
    {
      id: "google-ads-audience",
      title: "Define Audience",
      description: "Set default audience targeting parameters for new campaigns.",
      order: 3,
      estimatedMinutes: 5,
      requiresExternalAction: false,
      fields: [
        {
          name: "targetLocations",
          label: "Target Locations",
          type: "text",
          required: true,
          placeholder: "US, CA, UK",
          helpText: "Comma-separated list of country or region codes.",
        },
        {
          name: "ageRange",
          label: "Age Range",
          type: "select",
          required: false,
          options: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "All"],
        },
        {
          name: "interests",
          label: "Interest Categories",
          type: "text",
          required: false,
          placeholder: "Technology, Business, Marketing",
        },
      ],
    },
    {
      id: "google-ads-tracking",
      title: "Verify Tracking",
      description: "Confirm conversion tracking is properly configured on your website.",
      order: 4,
      estimatedMinutes: 4,
      requiresExternalAction: true,
      fields: [
        {
          name: "conversionId",
          label: "Conversion ID",
          type: "text",
          required: true,
          placeholder: "AW-123456789",
        },
        {
          name: "conversionLabel",
          label: "Conversion Label",
          type: "text",
          required: false,
          placeholder: "abcDEF123",
        },
        {
          name: "websiteUrl",
          label: "Website URL",
          type: "url",
          required: true,
          placeholder: "https://example.com",
        },
      ],
    },
  ],
} as const;

const GBP_WIZARD: SetupWizard = {
  integrationId: "google-business-profile",
  name: "Google Business Profile",
  description: "Manage your Google Business listing, reviews, and local search presence.",
  requiredEnvVars: [
    "GBP_CLIENT_ID",
    "GBP_CLIENT_SECRET",
    "GBP_REFRESH_TOKEN",
    "GBP_ACCOUNT_ID",
  ],
  totalEstimatedMinutes: 10,
  steps: [
    {
      id: "gbp-authorize",
      title: "Authorize",
      description: "Grant Sovereign AI access to your Google Business Profile via OAuth.",
      order: 1,
      estimatedMinutes: 2,
      requiresExternalAction: true,
      fields: [
        {
          name: "clientId",
          label: "Client ID",
          type: "text",
          required: true,
          placeholder: "123456789.apps.googleusercontent.com",
        },
        {
          name: "clientSecret",
          label: "Client Secret",
          type: "password",
          required: true,
        },
      ],
    },
    {
      id: "gbp-verify-ownership",
      title: "Verify Ownership",
      description: "Confirm ownership of your business listing via phone, email, or postcard.",
      order: 2,
      estimatedMinutes: 5,
      requiresExternalAction: true,
      fields: [
        {
          name: "businessName",
          label: "Business Name",
          type: "text",
          required: true,
          placeholder: "Acme Corp",
        },
        {
          name: "verificationMethod",
          label: "Verification Method",
          type: "select",
          required: true,
          options: ["phone", "email", "postcard", "instant"],
          helpText: "Select how you would like to verify ownership.",
        },
        {
          name: "accountId",
          label: "Account ID",
          type: "text",
          required: true,
          placeholder: "accounts/123456789",
        },
      ],
    },
    {
      id: "gbp-sync-data",
      title: "Sync Data",
      description: "Configure automatic syncing of business info, hours, photos, and reviews.",
      order: 3,
      estimatedMinutes: 3,
      requiresExternalAction: false,
      fields: [
        {
          name: "syncFrequency",
          label: "Sync Frequency",
          type: "select",
          required: true,
          options: ["hourly", "daily", "weekly"],
        },
        {
          name: "syncReviews",
          label: "Sync Reviews",
          type: "boolean",
          required: false,
          helpText: "Automatically import new reviews for AI response generation.",
        },
        {
          name: "syncPhotos",
          label: "Sync Photos",
          type: "boolean",
          required: false,
        },
      ],
    },
  ],
} as const;

const META_WIZARD: SetupWizard = {
  integrationId: "meta",
  name: "Meta (Facebook / Instagram)",
  description: "Connect Facebook Pages and Instagram for social advertising and engagement.",
  requiredEnvVars: [
    "META_APP_ID",
    "META_APP_SECRET",
    "META_ACCESS_TOKEN",
    "META_PIXEL_ID",
    "META_AD_ACCOUNT_ID",
  ],
  totalEstimatedMinutes: 12,
  steps: [
    {
      id: "meta-connect-page",
      title: "Connect Page",
      description: "Link your Facebook Page and Instagram Business account.",
      order: 1,
      estimatedMinutes: 3,
      requiresExternalAction: true,
      fields: [
        {
          name: "appId",
          label: "App ID",
          type: "text",
          required: true,
          placeholder: "123456789012345",
          helpText: "From the Meta Developer Portal under your app settings.",
        },
        {
          name: "appSecret",
          label: "App Secret",
          type: "password",
          required: true,
        },
        {
          name: "pageId",
          label: "Facebook Page ID",
          type: "text",
          required: true,
          placeholder: "123456789012345",
        },
      ],
    },
    {
      id: "meta-set-pixel",
      title: "Set Pixel",
      description: "Configure the Meta Pixel for conversion tracking on your website.",
      order: 2,
      estimatedMinutes: 5,
      requiresExternalAction: true,
      fields: [
        {
          name: "pixelId",
          label: "Pixel ID",
          type: "text",
          required: true,
          placeholder: "123456789012345",
        },
        {
          name: "websiteUrl",
          label: "Website URL",
          type: "url",
          required: true,
          placeholder: "https://example.com",
        },
        {
          name: "enableAdvancedMatching",
          label: "Enable Advanced Matching",
          type: "boolean",
          required: false,
          helpText: "Improves attribution by matching customer data with Meta profiles.",
        },
      ],
    },
    {
      id: "meta-ad-account",
      title: "Create Ad Account",
      description: "Link or create an ad account for running paid campaigns.",
      order: 3,
      estimatedMinutes: 4,
      requiresExternalAction: true,
      fields: [
        {
          name: "adAccountId",
          label: "Ad Account ID",
          type: "text",
          required: true,
          placeholder: "act_123456789",
          helpText: "Starts with 'act_' followed by your numeric account ID.",
        },
        {
          name: "currency",
          label: "Currency",
          type: "select",
          required: true,
          options: ["USD", "EUR", "GBP", "CAD", "AUD"],
        },
        {
          name: "timezone",
          label: "Timezone",
          type: "select",
          required: true,
          options: [
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Europe/London",
            "Europe/Berlin",
          ],
        },
      ],
    },
  ],
} as const;

const STRIPE_WIZARD: SetupWizard = {
  integrationId: "stripe",
  name: "Stripe",
  description: "Payment processing — verify webhook configuration and set up products.",
  requiredEnvVars: [
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ],
  totalEstimatedMinutes: 8,
  steps: [
    {
      id: "stripe-verify-webhook",
      title: "Verify Webhook",
      description: "Confirm the Stripe webhook endpoint is reachable and the signing secret is correct.",
      order: 1,
      estimatedMinutes: 3,
      requiresExternalAction: false,
      fields: [
        {
          name: "webhookUrl",
          label: "Webhook Endpoint URL",
          type: "url",
          required: true,
          placeholder: "https://api.example.com/webhooks/stripe",
        },
        {
          name: "webhookSecret",
          label: "Webhook Signing Secret",
          type: "password",
          required: true,
          placeholder: "whsec_...",
        },
        {
          name: "events",
          label: "Subscribed Events",
          type: "text",
          required: true,
          placeholder: "checkout.session.completed, invoice.paid",
          helpText: "Comma-separated list of Stripe event types to listen for.",
        },
      ],
    },
    {
      id: "stripe-configure-products",
      title: "Configure Products",
      description: "Set up default products, prices, and subscription tiers.",
      order: 2,
      estimatedMinutes: 5,
      requiresExternalAction: false,
      fields: [
        {
          name: "defaultCurrency",
          label: "Default Currency",
          type: "select",
          required: true,
          options: ["usd", "eur", "gbp", "cad", "aud"],
        },
        {
          name: "enableSubscriptions",
          label: "Enable Subscriptions",
          type: "boolean",
          required: false,
          helpText: "Allow recurring billing via Stripe Subscriptions.",
        },
        {
          name: "trialDays",
          label: "Default Trial Period (days)",
          type: "number",
          required: false,
          placeholder: "14",
        },
      ],
    },
  ],
} as const;

const SENDGRID_WIZARD: SetupWizard = {
  integrationId: "sendgrid",
  name: "SendGrid",
  description: "Transactional and marketing email delivery.",
  requiredEnvVars: [
    "SENDGRID_API_KEY",
    "SENDGRID_FROM_EMAIL",
    "SENDGRID_FROM_NAME",
  ],
  totalEstimatedMinutes: 12,
  steps: [
    {
      id: "sendgrid-verify-domain",
      title: "Verify Domain",
      description: "Authenticate your sending domain by adding DNS records (CNAME, TXT).",
      order: 1,
      estimatedMinutes: 5,
      requiresExternalAction: true,
      fields: [
        {
          name: "domain",
          label: "Sending Domain",
          type: "text",
          required: true,
          placeholder: "mail.example.com",
        },
        {
          name: "apiKey",
          label: "API Key",
          type: "password",
          required: true,
          placeholder: "SG.xxxx",
          helpText: "A SendGrid API key with full access or mail-send permission.",
        },
      ],
    },
    {
      id: "sendgrid-authenticate-sender",
      title: "Authenticate Sender",
      description: "Verify the sender identity that will appear in the From field.",
      order: 2,
      estimatedMinutes: 3,
      requiresExternalAction: true,
      fields: [
        {
          name: "fromEmail",
          label: "From Email",
          type: "email",
          required: true,
          placeholder: "noreply@example.com",
        },
        {
          name: "fromName",
          label: "From Name",
          type: "text",
          required: true,
          placeholder: "Acme Corp",
        },
        {
          name: "replyToEmail",
          label: "Reply-To Email",
          type: "email",
          required: false,
          placeholder: "support@example.com",
        },
      ],
    },
    {
      id: "sendgrid-test-email",
      title: "Test Email",
      description: "Send a test email to confirm delivery is working end-to-end.",
      order: 3,
      estimatedMinutes: 4,
      requiresExternalAction: false,
      fields: [
        {
          name: "testRecipient",
          label: "Test Recipient Email",
          type: "email",
          required: true,
          placeholder: "you@example.com",
        },
        {
          name: "subject",
          label: "Test Subject Line",
          type: "text",
          required: false,
          placeholder: "Sovereign AI — Test Email",
        },
      ],
    },
  ],
} as const;

const TWILIO_WIZARD: SetupWizard = {
  integrationId: "twilio",
  name: "Twilio",
  description: "Voice calling, SMS, and phone number management.",
  requiredEnvVars: [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
  ],
  totalEstimatedMinutes: 10,
  steps: [
    {
      id: "twilio-add-phone",
      title: "Add Phone Number",
      description: "Provision or link a Twilio phone number for inbound and outbound calls.",
      order: 1,
      estimatedMinutes: 3,
      requiresExternalAction: true,
      fields: [
        {
          name: "accountSid",
          label: "Account SID",
          type: "text",
          required: true,
          placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        },
        {
          name: "authToken",
          label: "Auth Token",
          type: "password",
          required: true,
        },
        {
          name: "phoneNumber",
          label: "Phone Number",
          type: "phone",
          required: true,
          placeholder: "+15551234567",
          helpText: "Must be in E.164 format (e.g. +15551234567).",
        },
      ],
    },
    {
      id: "twilio-configure-routing",
      title: "Configure Routing",
      description: "Set up call routing rules including webhook URLs and fallback numbers.",
      order: 2,
      estimatedMinutes: 4,
      requiresExternalAction: false,
      fields: [
        {
          name: "voiceWebhookUrl",
          label: "Voice Webhook URL",
          type: "url",
          required: true,
          placeholder: "https://api.example.com/webhooks/twilio/voice",
        },
        {
          name: "smsWebhookUrl",
          label: "SMS Webhook URL",
          type: "url",
          required: false,
          placeholder: "https://api.example.com/webhooks/twilio/sms",
        },
        {
          name: "fallbackNumber",
          label: "Fallback Phone Number",
          type: "phone",
          required: false,
          placeholder: "+15559876543",
          helpText: "Calls are forwarded here if the webhook is unreachable.",
        },
      ],
    },
    {
      id: "twilio-test-call",
      title: "Test Call",
      description: "Place a test call to verify the phone number and routing are functional.",
      order: 3,
      estimatedMinutes: 3,
      requiresExternalAction: false,
      fields: [
        {
          name: "testPhoneNumber",
          label: "Test Phone Number",
          type: "phone",
          required: true,
          placeholder: "+15551112222",
          helpText: "The number to call for the test.",
        },
        {
          name: "testMessage",
          label: "Test Message",
          type: "text",
          required: false,
          placeholder: "Hello from Sovereign AI!",
        },
      ],
    },
  ],
} as const;

const OPENAI_WIZARD: SetupWizard = {
  integrationId: "openai",
  name: "OpenAI",
  description: "AI text generation, embeddings, and image generation via OpenAI models.",
  requiredEnvVars: [
    "OPENAI_API_KEY",
    "OPENAI_ORG_ID",
  ],
  totalEstimatedMinutes: 5,
  steps: [
    {
      id: "openai-api-key",
      title: "Add API Key",
      description: "Provide your OpenAI API key and optional organization ID.",
      order: 1,
      estimatedMinutes: 2,
      requiresExternalAction: false,
      fields: [
        {
          name: "apiKey",
          label: "API Key",
          type: "password",
          required: true,
          placeholder: "sk-...",
          helpText: "From platform.openai.com > API Keys.",
        },
        {
          name: "orgId",
          label: "Organization ID",
          type: "text",
          required: false,
          placeholder: "org-...",
        },
      ],
    },
    {
      id: "openai-model-prefs",
      title: "Set Model Preferences",
      description: "Choose default models for text generation, embeddings, and images.",
      order: 2,
      estimatedMinutes: 2,
      requiresExternalAction: false,
      fields: [
        {
          name: "textModel",
          label: "Text Generation Model",
          type: "select",
          required: true,
          options: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
        },
        {
          name: "embeddingModel",
          label: "Embedding Model",
          type: "select",
          required: false,
          options: ["text-embedding-3-large", "text-embedding-3-small", "text-embedding-ada-002"],
        },
        {
          name: "maxTokens",
          label: "Default Max Tokens",
          type: "number",
          required: false,
          placeholder: "4096",
        },
        {
          name: "temperature",
          label: "Default Temperature",
          type: "number",
          required: false,
          placeholder: "0.7",
          helpText: "A value between 0 and 2. Lower values are more deterministic.",
        },
      ],
    },
    {
      id: "openai-test-generation",
      title: "Test Generation",
      description: "Send a test prompt to confirm the API key and model are working.",
      order: 3,
      estimatedMinutes: 1,
      requiresExternalAction: false,
      fields: [
        {
          name: "testPrompt",
          label: "Test Prompt",
          type: "text",
          required: false,
          placeholder: "Say hello in three languages.",
        },
      ],
    },
  ],
} as const;

const ANTHROPIC_WIZARD: SetupWizard = {
  integrationId: "anthropic",
  name: "Anthropic",
  description: "AI text generation via Claude models from Anthropic.",
  requiredEnvVars: [
    "ANTHROPIC_API_KEY",
  ],
  totalEstimatedMinutes: 5,
  steps: [
    {
      id: "anthropic-api-key",
      title: "Add API Key",
      description: "Provide your Anthropic API key.",
      order: 1,
      estimatedMinutes: 2,
      requiresExternalAction: false,
      fields: [
        {
          name: "apiKey",
          label: "API Key",
          type: "password",
          required: true,
          placeholder: "sk-ant-...",
          helpText: "From console.anthropic.com > API Keys.",
        },
      ],
    },
    {
      id: "anthropic-model-prefs",
      title: "Set Model Preferences",
      description: "Choose default Claude model and generation parameters.",
      order: 2,
      estimatedMinutes: 2,
      requiresExternalAction: false,
      fields: [
        {
          name: "model",
          label: "Default Model",
          type: "select",
          required: true,
          options: ["claude-sonnet-4-20250514", "claude-haiku-35-20241022", "claude-opus-4-20250514"],
        },
        {
          name: "maxTokens",
          label: "Default Max Tokens",
          type: "number",
          required: false,
          placeholder: "4096",
        },
        {
          name: "temperature",
          label: "Default Temperature",
          type: "number",
          required: false,
          placeholder: "0.7",
          helpText: "A value between 0 and 1. Lower values are more deterministic.",
        },
      ],
    },
    {
      id: "anthropic-test-generation",
      title: "Test Generation",
      description: "Send a test prompt to confirm the API key and model are working.",
      order: 3,
      estimatedMinutes: 1,
      requiresExternalAction: false,
      fields: [
        {
          name: "testPrompt",
          label: "Test Prompt",
          type: "text",
          required: false,
          placeholder: "Say hello in three languages.",
        },
      ],
    },
  ],
} as const;

/* ------------------------------------------------------------------ */
/*  Master constant — all wizards                                      */
/* ------------------------------------------------------------------ */

/** Setup wizards keyed by integration ID. */
export const INTEGRATION_WIZARDS: Readonly<Record<IntegrationId, SetupWizard>> = {
  "google-ads": GOOGLE_ADS_WIZARD,
  "google-business-profile": GBP_WIZARD,
  "meta": META_WIZARD,
  "stripe": STRIPE_WIZARD,
  "sendgrid": SENDGRID_WIZARD,
  "twilio": TWILIO_WIZARD,
  "openai": OPENAI_WIZARD,
  "anthropic": ANTHROPIC_WIZARD,
} as const;

/* ------------------------------------------------------------------ */
/*  Functions                                                          */
/* ------------------------------------------------------------------ */

/**
 * Return the ordered setup steps for a given integration.
 *
 * @param integrationId - The integration to look up.
 * @returns The wizard steps sorted by order, or an empty array if unknown.
 */
export function getWizardSteps(integrationId: IntegrationId): readonly IntegrationStep[] {
  const wizard = INTEGRATION_WIZARDS[integrationId];
  if (!wizard) {
    return [];
  }
  return [...wizard.steps].sort((a, b) => a.order - b.order);
}

/**
 * Validate the user-submitted data for a specific wizard step.
 *
 * Checks that every required field is present and non-empty and that
 * field values match their declared type constraints.
 *
 * @param integrationId - The integration whose step is being validated.
 * @param stepId        - The ID of the step within the wizard.
 * @param data          - Key-value pairs submitted by the user.
 * @returns A ValidationResult indicating success or listing errors.
 */
export function validateStepData(
  integrationId: IntegrationId,
  stepId: string,
  data: Readonly<Record<string, unknown>>,
): ValidationResult {
  const wizard = INTEGRATION_WIZARDS[integrationId];
  if (!wizard) {
    return { valid: false, errors: [{ field: "_integration", message: `Unknown integration: ${integrationId}` }] };
  }

  const step = wizard.steps.find((s) => s.id === stepId);
  if (!step) {
    return { valid: false, errors: [{ field: "_step", message: `Unknown step: ${stepId}` }] };
  }

  const errors: ValidationError[] = [];

  for (const field of step.fields) {
    const value = data[field.name];

    // Required check
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push({ field: field.name, message: `${field.label} is required.` });
      continue;
    }

    // Skip further validation if value is absent and not required
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Type-specific validation
    switch (field.type) {
      case "email": {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== "string" || !emailPattern.test(value)) {
          errors.push({ field: field.name, message: `${field.label} must be a valid email address.` });
        }
        break;
      }
      case "url": {
        try {
          new URL(String(value));
        } catch {
          errors.push({ field: field.name, message: `${field.label} must be a valid URL.` });
        }
        break;
      }
      case "number": {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({ field: field.name, message: `${field.label} must be a valid number.` });
        }
        break;
      }
      case "phone": {
        const phonePattern = /^\+[1-9]\d{6,14}$/;
        if (typeof value !== "string" || !phonePattern.test(value)) {
          errors.push({ field: field.name, message: `${field.label} must be in E.164 format (e.g. +15551234567).` });
        }
        break;
      }
      case "select": {
        if (field.options && !field.options.includes(String(value))) {
          errors.push({
            field: field.name,
            message: `${field.label} must be one of: ${field.options.join(", ")}.`,
          });
        }
        break;
      }
      case "boolean": {
        if (typeof value !== "boolean") {
          errors.push({ field: field.name, message: `${field.label} must be true or false.` });
        }
        break;
      }
      case "text":
      case "password": {
        if (typeof value !== "string") {
          errors.push({ field: field.name, message: `${field.label} must be a string.` });
        }
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Return the list of environment variables required by an integration.
 *
 * @param integrationId - The integration to look up.
 * @returns An array of environment variable names, or an empty array if unknown.
 */
export function getRequiredEnvVars(integrationId: IntegrationId): readonly string[] {
  const wizard = INTEGRATION_WIZARDS[integrationId];
  if (!wizard) {
    return [];
  }
  return wizard.requiredEnvVars;
}

/**
 * Generate a test payload that can be used to verify connectivity
 * to an integration's API endpoint. Does not make any actual calls.
 *
 * @param integrationId - The integration to generate a payload for.
 * @returns A TestPayload object, or null if the integration is unknown.
 */
export function generateTestPayload(integrationId: IntegrationId): TestPayload | null {
  const payloads: Readonly<Record<IntegrationId, TestPayload>> = {
    "google-ads": {
      integrationId: "google-ads",
      endpoint: "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
      method: "GET",
      headers: { Authorization: "Bearer {{ACCESS_TOKEN}}", "Content-Type": "application/json" },
      body: null,
      expectedStatus: 200,
    },
    "google-business-profile": {
      integrationId: "google-business-profile",
      endpoint: "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      method: "GET",
      headers: { Authorization: "Bearer {{ACCESS_TOKEN}}", "Content-Type": "application/json" },
      body: null,
      expectedStatus: 200,
    },
    "meta": {
      integrationId: "meta",
      endpoint: "https://graph.facebook.com/v21.0/me",
      method: "GET",
      headers: { Authorization: "Bearer {{ACCESS_TOKEN}}" },
      body: null,
      expectedStatus: 200,
    },
    "stripe": {
      integrationId: "stripe",
      endpoint: "https://api.stripe.com/v1/balance",
      method: "GET",
      headers: { Authorization: "Bearer {{STRIPE_SECRET_KEY}}" },
      body: null,
      expectedStatus: 200,
    },
    "sendgrid": {
      integrationId: "sendgrid",
      endpoint: "https://api.sendgrid.com/v3/mail/send",
      method: "POST",
      headers: {
        Authorization: "Bearer {{SENDGRID_API_KEY}}",
        "Content-Type": "application/json",
      },
      body: {
        personalizations: [{ to: [{ email: "test@example.com" }] }],
        from: { email: "{{SENDGRID_FROM_EMAIL}}" },
        subject: "Sovereign AI — Connection Test",
        content: [{ type: "text/plain", value: "This is a test email from Sovereign AI." }],
      },
      expectedStatus: 202,
    },
    "twilio": {
      integrationId: "twilio",
      endpoint: "https://api.twilio.com/2010-04-01/Accounts/{{TWILIO_ACCOUNT_SID}}.json",
      method: "GET",
      headers: {
        Authorization: "Basic {{BASE64(TWILIO_ACCOUNT_SID:TWILIO_AUTH_TOKEN)}}",
      },
      body: null,
      expectedStatus: 200,
    },
    "openai": {
      integrationId: "openai",
      endpoint: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        Authorization: "Bearer {{OPENAI_API_KEY}}",
        "Content-Type": "application/json",
      },
      body: {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Respond with exactly: CONNECTION_OK" }],
        max_tokens: 20,
      },
      expectedStatus: 200,
    },
    "anthropic": {
      integrationId: "anthropic",
      endpoint: "https://api.anthropic.com/v1/messages",
      method: "POST",
      headers: {
        "x-api-key": "{{ANTHROPIC_API_KEY}}",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: {
        model: "claude-sonnet-4-20250514",
        max_tokens: 20,
        messages: [{ role: "user", content: "Respond with exactly: CONNECTION_OK" }],
      },
      expectedStatus: 200,
    },
  };

  return payloads[integrationId] ?? null;
}

/**
 * Return the estimated total minutes to complete the setup wizard
 * for a given integration.
 *
 * @param integrationId - The integration to look up.
 * @returns Estimated minutes, or 0 if the integration is unknown.
 */
export function estimateSetupTime(integrationId: IntegrationId): number {
  const wizard = INTEGRATION_WIZARDS[integrationId];
  if (!wizard) {
    return 0;
  }
  return wizard.totalEstimatedMinutes;
}
